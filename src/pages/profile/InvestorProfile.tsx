import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MessageCircle, UserCircle, DollarSign, TrendingUp } from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import { getUserByIdAPI } from '../../api/users';
import toast from 'react-hot-toast';

export const InvestorProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const [investor, setInvestor] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      getUserByIdAPI(id)
        .then(res => setInvestor(res.data))
        .catch(() => toast.error('Failed to load profile'))
        .finally(() => setIsLoading(false));
    }
  }, [id]);

  if (isLoading) {
    return <div className="text-center py-12"><p className="text-gray-500">Loading profile...</p></div>;
  }

  if (!investor || investor.role !== 'investor') {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Investor not found</h2>
        <Link to="/dashboard/entrepreneur">
          <Button variant="outline" className="mt-4">Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  const isCurrentUser = currentUser?.id === investor._id;

  return (
    <div className="space-y-6 animate-fade-in">
      <Card>
        <CardBody className="sm:flex sm:items-start sm:justify-between p-6">
          <div className="sm:flex sm:space-x-6">
            <Avatar
              src={investor.profilePhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(investor.name)}&background=4F46E5&color=fff`}
              alt={investor.name}
              size="xl"
              status="online"
              className="mx-auto sm:mx-0"
            />
            <div className="mt-4 sm:mt-0 text-center sm:text-left">
              <h1 className="text-2xl font-bold text-gray-900">{investor.name}</h1>
              <p className="text-gray-600 mt-1">Investor</p>
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start mt-3">
                {investor.investmentFocus?.map((focus: string) => (
                  <Badge key={focus} variant="primary">{focus}</Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 sm:mt-0 flex gap-2">
            {!isCurrentUser && (
              <Link to={`/chat/${investor._id}`}>
                <Button variant="outline" leftIcon={<MessageCircle size={18} />}>Message</Button>
              </Link>
            )}
            {isCurrentUser && (
              <Button variant="outline" leftIcon={<UserCircle size={18} />}>Edit Profile</Button>
            )}
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><h2 className="text-lg font-medium text-gray-900">About</h2></CardHeader>
            <CardBody>
              <p className="text-gray-700">{investor.bio || 'No bio provided yet.'}</p>
            </CardBody>
          </Card>

          {investor.portfolioCompanies?.length > 0 && (
            <Card>
              <CardHeader><h2 className="text-lg font-medium text-gray-900">Portfolio Companies</h2></CardHeader>
              <CardBody>
                <div className="flex flex-wrap gap-2">
                  {investor.portfolioCompanies.map((company: string) => (
                    <span key={company} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                      {company}
                    </span>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><h2 className="text-lg font-medium text-gray-900">Investment Details</h2></CardHeader>
            <CardBody>
              <div className="space-y-3">
                {investor.minimumInvestment > 0 && (
                  <div>
                    <span className="text-sm text-gray-500">Minimum Investment</span>
                    <div className="flex items-center mt-1">
                      <DollarSign size={16} className="text-green-600 mr-1" />
                      <p className="font-semibold text-gray-900">${investor.minimumInvestment.toLocaleString()}</p>
                    </div>
                  </div>
                )}
                {investor.maximumInvestment > 0 && (
                  <div>
                    <span className="text-sm text-gray-500">Maximum Investment</span>
                    <div className="flex items-center mt-1">
                      <TrendingUp size={16} className="text-blue-600 mr-1" />
                      <p className="font-semibold text-gray-900">${investor.maximumInvestment.toLocaleString()}</p>
                    </div>
                  </div>
                )}
                {investor.preferredStages?.length > 0 && (
                  <div>
                    <span className="text-sm text-gray-500">Preferred Stages</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {investor.preferredStages.map((stage: string) => (
                        <Badge key={stage} variant="accent" size="sm">{stage}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader><h2 className="text-lg font-medium text-gray-900">Contact</h2></CardHeader>
            <CardBody>
              <p className="text-sm text-gray-600">{investor.email}</p>
              {investor.phone && <p className="text-sm text-gray-600 mt-1">{investor.phone}</p>}
              {investor.location && <p className="text-sm text-gray-600 mt-1">{investor.location}</p>}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};
