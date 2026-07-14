import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MessageCircle, Calendar, Building2, MapPin, UserCircle, FileText, DollarSign } from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import { getUserByIdAPI } from '../../api/users';
import { scheduleMeetingAPI } from '../../api/meetings';
import toast from 'react-hot-toast';

export const EntrepreneurProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const [entrepreneur, setEntrepreneur] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isScheduling, setIsScheduling] = useState(false);

  useEffect(() => {
    if (id) {
      getUserByIdAPI(id)
        .then(res => setEntrepreneur(res.data))
        .catch(() => toast.error('Failed to load profile'))
        .finally(() => setIsLoading(false));
    }
  }, [id]);

  const handleScheduleMeeting = async () => {
    if (!id) return;
    setIsScheduling(true);
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];

      await scheduleMeetingAPI({
        attendeeId: id,
        title: `Meeting with ${entrepreneur?.name}`,
        description: 'Investment discussion',
        date: dateStr,
        startTime: '10:00',
        endTime: '11:00',
      });
      toast.success('Meeting request sent!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to schedule meeting');
    } finally {
      setIsScheduling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Loading profile...</p>
      </div>
    );
  }

  if (!entrepreneur || entrepreneur.role !== 'entrepreneur') {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Entrepreneur not found</h2>
        <p className="text-gray-600 mt-2">The profile you're looking for doesn't exist.</p>
        <Link to="/dashboard/investor">
          <Button variant="outline" className="mt-4">Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  const isCurrentUser = currentUser?.id === entrepreneur._id;
  const isInvestor = currentUser?.role === 'investor';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Profile header */}
      <Card>
        <CardBody className="sm:flex sm:items-start sm:justify-between p-6">
          <div className="sm:flex sm:space-x-6">
            <Avatar
              src={entrepreneur.profilePhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(entrepreneur.name)}&background=4F46E5&color=fff`}
              alt={entrepreneur.name}
              size="xl"
              status="online"
              className="mx-auto sm:mx-0"
            />
            <div className="mt-4 sm:mt-0 text-center sm:text-left">
              <h1 className="text-2xl font-bold text-gray-900">{entrepreneur.name}</h1>
              {entrepreneur.startupName && (
                <p className="text-gray-600 flex items-center justify-center sm:justify-start mt-1">
                  <Building2 size={16} className="mr-1" />
                  Founder at {entrepreneur.startupName}
                </p>
              )}
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start mt-3">
                {entrepreneur.industry && <Badge variant="primary">{entrepreneur.industry}</Badge>}
                {entrepreneur.location && (
                  <Badge variant="gray">
                    <MapPin size={14} className="mr-1" />
                    {entrepreneur.location}
                  </Badge>
                )}
                {entrepreneur.startupStage && (
                  <Badge variant="accent">{entrepreneur.startupStage}</Badge>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 sm:mt-0 flex flex-col sm:flex-row gap-2 justify-center sm:justify-end">
            {!isCurrentUser && (
              <>
                <Link to={`/chat/${entrepreneur._id}`}>
                  <Button variant="outline" leftIcon={<MessageCircle size={18} />}>Message</Button>
                </Link>
                {isInvestor && (
                  <Button
                    leftIcon={<Calendar size={18} />}
                    onClick={handleScheduleMeeting}
                    isLoading={isScheduling}
                  >
                    Schedule Meeting
                  </Button>
                )}
              </>
            )}
            {isCurrentUser && (
              <Button variant="outline" leftIcon={<UserCircle size={18} />}>Edit Profile</Button>
            )}
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* About */}
          <Card>
            <CardHeader><h2 className="text-lg font-medium text-gray-900">About</h2></CardHeader>
            <CardBody>
              <p className="text-gray-700">{entrepreneur.bio || 'No bio provided yet.'}</p>
            </CardBody>
          </Card>

          {/* Startup Overview */}
          {(entrepreneur.startupName || entrepreneur.industry) && (
            <Card>
              <CardHeader><h2 className="text-lg font-medium text-gray-900">Startup Overview</h2></CardHeader>
              <CardBody>
                <div className="space-y-4">
                  {entrepreneur.startupName && (
                    <div>
                      <h3 className="text-md font-medium text-gray-900">Company</h3>
                      <p className="text-gray-700 mt-1">{entrepreneur.startupName}</p>
                    </div>
                  )}
                  {entrepreneur.industry && (
                    <div>
                      <h3 className="text-md font-medium text-gray-900">Industry</h3>
                      <p className="text-gray-700 mt-1">{entrepreneur.industry}</p>
                    </div>
                  )}
                  {entrepreneur.startupStage && (
                    <div>
                      <h3 className="text-md font-medium text-gray-900">Stage</h3>
                      <p className="text-gray-700 mt-1 capitalize">{entrepreneur.startupStage}</p>
                    </div>
                  )}
                  {entrepreneur.website && (
                    <div>
                      <h3 className="text-md font-medium text-gray-900">Website</h3>
                      <a href={entrepreneur.website} target="_blank" rel="noreferrer" className="text-primary-600 hover:underline">
                        {entrepreneur.website}
                      </a>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Funding */}
          {entrepreneur.fundingNeeded > 0 && (
            <Card>
              <CardHeader><h2 className="text-lg font-medium text-gray-900">Funding</h2></CardHeader>
              <CardBody>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-gray-500">Seeking</span>
                    <div className="flex items-center mt-1">
                      <DollarSign size={18} className="text-accent-600 mr-1" />
                      <p className="text-lg font-semibold text-gray-900">
                        ${entrepreneur.fundingNeeded.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {entrepreneur.startupStage && (
                    <div>
                      <span className="text-sm text-gray-500">Current Stage</span>
                      <p className="text-md font-medium text-gray-900 capitalize mt-1">{entrepreneur.startupStage}</p>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          )}

          {/* Contact */}
          <Card>
            <CardHeader><h2 className="text-lg font-medium text-gray-900">Contact</h2></CardHeader>
            <CardBody>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">{entrepreneur.email}</p>
                {entrepreneur.phone && <p className="text-sm text-gray-600">{entrepreneur.phone}</p>}
                {entrepreneur.location && <p className="text-sm text-gray-600">{entrepreneur.location}</p>}
              </div>
              {!isCurrentUser && isInvestor && (
                <Button
                  className="mt-4 w-full"
                  onClick={handleScheduleMeeting}
                  isLoading={isScheduling}
                  leftIcon={<FileText size={16} />}
                >
                  Request Meeting
                </Button>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};
