import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Bell, Calendar, TrendingUp, PlusCircle, DollarSign } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import { getMeetingsAPI, acceptMeetingAPI, rejectMeetingAPI } from '../../api/meetings';
import { getDocumentsAPI } from '../../api/documents';
import { getBalanceAPI } from '../../api/payments';
import { getAllInvestorsAPI } from '../../api/users';
import toast from 'react-hot-toast';
import { Meeting, User } from '../../types';

export const EntrepreneurDashboard: React.FC = () => {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [balance, setBalance] = useState(0);
  const [investors, setInvestors] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [meetingsRes, docsRes, balanceRes, investorsRes] = await Promise.all([
          getMeetingsAPI(),
          getDocumentsAPI(),
          getBalanceAPI(),
          getAllInvestorsAPI(),
        ]);
        setMeetings(meetingsRes.data);
        setDocuments(docsRes.data);
        setBalance(balanceRes.data.balance);
        setInvestors(investorsRes.data);
      } catch {
        toast.error('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAccept = async (id: string) => {
    try {
      await acceptMeetingAPI(id);
      toast.success('Meeting accepted');
      setMeetings(prev => prev.map(m => m._id === id ? { ...m, status: 'accepted' } : m));
    } catch {
      toast.error('Failed to accept meeting');
    }
  };

  const handleReject = async (id: string) => {
    try {
      await rejectMeetingAPI(id);
      toast.success('Meeting rejected');
      setMeetings(prev => prev.map(m => m._id === id ? { ...m, status: 'rejected' } : m));
    } catch {
      toast.error('Failed to reject meeting');
    }
  };

  if (!user) return null;

  const pendingMeetings = meetings.filter(m => m.status === 'pending');
  const upcomingMeetings = meetings.filter(m => m.status === 'accepted' && new Date(m.date) >= new Date());

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome, {user.name}</h1>
          <p className="text-gray-600">Here's what's happening with your startup today</p>
        </div>
        <Link to="/investors">
          <Button leftIcon={<PlusCircle size={18} />}>Find Investors</Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-primary-50 border border-primary-100">
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-primary-100 rounded-full mr-4">
                <Bell size={20} className="text-primary-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-primary-700">Pending Meetings</p>
                <h3 className="text-xl font-semibold text-primary-900">{pendingMeetings.length}</h3>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-secondary-50 border border-secondary-100">
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-secondary-100 rounded-full mr-4">
                <Users size={20} className="text-secondary-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-secondary-700">Total Connections</p>
                <h3 className="text-xl font-semibold text-secondary-900">{user.connections?.length || 0}</h3>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-accent-50 border border-accent-100">
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-accent-100 rounded-full mr-4">
                <Calendar size={20} className="text-accent-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-accent-700">Upcoming Meetings</p>
                <h3 className="text-xl font-semibold text-accent-900">{upcomingMeetings.length}</h3>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-success-50 border border-success-100">
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-full mr-4">
                <DollarSign size={20} className="text-success-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-success-700">Wallet Balance</p>
                <h3 className="text-xl font-semibold text-success-900">${balance}</h3>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Meeting Requests */}
        <Card>
          <CardHeader className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">Meeting Requests</h2>
            <Badge variant="primary">{pendingMeetings.length} pending</Badge>
          </CardHeader>
          <CardBody>
            {isLoading ? (
              <p className="text-gray-500 text-sm text-center py-4">Loading...</p>
            ) : pendingMeetings.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">No pending meeting requests</p>
            ) : (
              <div className="space-y-3">
                {pendingMeetings.map(meeting => (
                  <div key={meeting._id} className="p-3 border border-gray-100 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{meeting.title}</p>
                        <p className="text-xs text-gray-500">
                          From: {(meeting.organizer as any)?.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(meeting.date).toLocaleDateString()} · {meeting.startTime} - {meeting.endTime}
                        </p>
                      </div>
                      <Badge variant="primary">pending</Badge>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" onClick={() => handleAccept(meeting._id)}>Accept</Button>
                      <Button size="sm" variant="outline" onClick={() => handleReject(meeting._id)}>Reject</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* All Meetings */}
        <Card>
          <CardHeader className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">All Meetings</h2>
            <Badge variant="secondary">{meetings.length} total</Badge>
          </CardHeader>
          <CardBody>
            {isLoading ? (
              <p className="text-gray-500 text-sm text-center py-4">Loading...</p>
            ) : meetings.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">No meetings yet</p>
            ) : (
              <div className="space-y-3">
                {meetings.slice(0, 5).map(meeting => (
                  <div key={meeting._id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{meeting.title}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(meeting.date).toLocaleDateString()} · {meeting.startTime} - {meeting.endTime}
                      </p>
                      <p className="text-xs text-gray-500">
                        With: {(meeting.organizer as any)?._id === user.id
                          ? (meeting.attendee as any)?.name
                          : (meeting.organizer as any)?.name}
                      </p>
                    </div>
                    <Badge variant={
                      meeting.status === 'accepted' ? 'success' :
                      meeting.status === 'rejected' ? 'error' :
                      meeting.status === 'cancelled' ? 'gray' : 'primary'
                    }>
                      {meeting.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Documents and Investors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">Recent Documents</h2>
            <Link to="/documents" className="text-sm text-primary-600 hover:text-primary-500">View all</Link>
          </CardHeader>
          <CardBody>
            {isLoading ? (
              <p className="text-gray-500 text-sm text-center py-4">Loading...</p>
            ) : documents.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-gray-500 text-sm">No documents yet</p>
                <Link to="/documents">
                  <Button size="sm" variant="outline" className="mt-2">Upload Document</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {documents.slice(0, 4).map(doc => (
                  <div key={doc._id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{doc.title}</p>
                      <p className="text-xs text-gray-500">{doc.fileType}</p>
                    </div>
                    <Badge variant={doc.status === 'signed' ? 'success' : doc.status === 'shared' ? 'secondary' : 'gray'}>
                      {doc.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">Available Investors</h2>
            <Link to="/investors" className="text-sm text-primary-600 hover:text-primary-500">View all</Link>
          </CardHeader>
          <CardBody>
            {isLoading ? (
              <p className="text-gray-500 text-sm text-center py-4">Loading...</p>
            ) : investors.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">No investors found</p>
            ) : (
              <div className="space-y-3">
                {investors.slice(0, 4).map((investor: any) => (
                  <div key={investor._id} className="flex items-center p-3 border border-gray-100 rounded-lg">
                    <img
                      src={investor.profilePhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(investor.name)}&background=4F46E5&color=fff`}
                      alt={investor.name}
                      className="w-10 h-10 rounded-full mr-3 object-cover"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{investor.name}</p>
                      <p className="text-xs text-gray-500">
                        {investor.investmentFocus?.slice(0, 2).join(', ') || 'General Investor'}
                      </p>
                    </div>
                    <Link to={`/profile/investor/${investor._id}`}>
                      <Button size="sm" variant="outline">View</Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
};
