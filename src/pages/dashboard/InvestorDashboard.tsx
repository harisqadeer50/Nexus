import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, PieChart, Search, PlusCircle, Calendar, DollarSign, TrendingUp } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import { getMeetingsAPI, scheduleMeetingAPI } from '../../api/meetings';
import { getBalanceAPI, getTransactionsAPI } from '../../api/payments';
import { getAllEntrepreneursAPI } from '../../api/users';
import toast from 'react-hot-toast';
import { Meeting, Transaction, User } from '../../types';

export const InvestorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balance, setBalance] = useState(0);
  const [entrepreneurs, setEntrepreneurs] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [schedulingFor, setSchedulingFor] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [meetingsRes, balanceRes, transactionsRes, entrepreneursRes] = await Promise.all([
          getMeetingsAPI(),
          getBalanceAPI(),
          getTransactionsAPI(),
          getAllEntrepreneursAPI(),
        ]);
        setMeetings(meetingsRes.data);
        setBalance(balanceRes.data.balance);
        setTransactions(transactionsRes.data);
        setEntrepreneurs(entrepreneursRes.data);
      } catch {
        toast.error('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleScheduleMeeting = async (entrepreneurId: string, entrepreneurName: string) => {
    setSchedulingFor(entrepreneurId);
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];

      await scheduleMeetingAPI({
        attendeeId: entrepreneurId,
        title: `Meeting with ${entrepreneurName}`,
        description: 'Investment discussion',
        date: dateStr,
        startTime: '10:00',
        endTime: '11:00',
      });
      toast.success(`Meeting request sent to ${entrepreneurName}`);
      const meetingsRes = await getMeetingsAPI();
      setMeetings(meetingsRes.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to schedule meeting');
    } finally {
      setSchedulingFor(null);
    }
  };

  if (!user) return null;

  const filteredEntrepreneurs = entrepreneurs.filter((e: any) =>
    searchQuery === '' ||
    e.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.startupName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.industry?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const upcomingMeetings = meetings.filter(m =>
    m.status === 'accepted' && new Date(m.date) >= new Date()
  );

  const uniqueIndustries = [...new Set(entrepreneurs.map((e: any) => e.industry).filter(Boolean))];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome, {user.name}</h1>
          <p className="text-gray-600">Find and connect with promising entrepreneurs</p>
        </div>
        <Link to="/entrepreneurs">
          <Button leftIcon={<PlusCircle size={18} />}>View All Startups</Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-primary-50 border border-primary-100">
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-primary-100 rounded-full mr-4">
                <Users size={20} className="text-primary-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-primary-700">Total Startups</p>
                <h3 className="text-xl font-semibold text-primary-900">{entrepreneurs.length}</h3>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-secondary-50 border border-secondary-100">
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-secondary-100 rounded-full mr-4">
                <Calendar size={20} className="text-secondary-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-secondary-700">Upcoming Meetings</p>
                <h3 className="text-xl font-semibold text-secondary-900">{upcomingMeetings.length}</h3>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-accent-50 border border-accent-100">
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-accent-100 rounded-full mr-4">
                <DollarSign size={20} className="text-accent-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-accent-700">Wallet Balance</p>
                <h3 className="text-xl font-semibold text-accent-900">${balance}</h3>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-success-50 border border-success-100">
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-full mr-4">
                <TrendingUp size={20} className="text-success-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-success-700">Transactions</p>
                <h3 className="text-xl font-semibold text-success-900">{transactions.length}</h3>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Meetings */}
      {meetings.length > 0 && (
        <Card>
          <CardHeader className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">Recent Meetings</h2>
            <Badge variant="primary">{meetings.length} total</Badge>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {meetings.slice(0, 6).map(meeting => (
                <div key={meeting._id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{meeting.title}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(meeting.date).toLocaleDateString()} · {meeting.startTime}
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
          </CardBody>
        </Card>
      )}

      {/* Search */}
      <div className="w-full md:w-1/2">
        <Input
          placeholder="Search startups, industries..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          fullWidth
          startAdornment={<Search size={18} />}
        />
      </div>

      {/* Industries */}
      {uniqueIndustries.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {uniqueIndustries.map(industry => (
            <button
              key={industry}
              onClick={() => setSearchQuery(industry)}
              className="px-3 py-1 text-sm bg-primary-50 text-primary-700 rounded-full hover:bg-primary-100 transition-colors"
            >
              {industry}
            </button>
          ))}
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      )}

      {/* Entrepreneurs Grid */}
      <Card>
        <CardHeader className="flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">Featured Startups</h2>
          <Badge variant="secondary">{filteredEntrepreneurs.length} found</Badge>
        </CardHeader>
        <CardBody>
          {isLoading ? (
            <p className="text-gray-500 text-center py-8">Loading startups...</p>
          ) : filteredEntrepreneurs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No startups match your search</p>
              <Button variant="outline" className="mt-2" onClick={() => setSearchQuery('')}>
                Clear search
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEntrepreneurs.map((entrepreneur: any) => (
                <div key={entrepreneur._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center mb-3">
                    <img
                      src={entrepreneur.profilePhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(entrepreneur.name)}&background=4F46E5&color=fff`}
                      alt={entrepreneur.name}
                      className="w-12 h-12 rounded-full mr-3 object-cover"
                    />
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">{entrepreneur.name}</h3>
                      <p className="text-xs text-gray-500">{entrepreneur.startupName || 'Startup'}</p>
                    </div>
                  </div>
                  {entrepreneur.industry && (
                    <span className="inline-block px-2 py-1 text-xs bg-primary-50 text-primary-700 rounded-full mb-2">
                      {entrepreneur.industry}
                    </span>
                  )}
                  {entrepreneur.bio && (
                    <p className="text-xs text-gray-600 mb-3 line-clamp-2">{entrepreneur.bio}</p>
                  )}
                  {entrepreneur.fundingNeeded > 0 && (
                    <p className="text-xs text-gray-500 mb-3">
                      Seeking: <span className="font-medium text-gray-700">${entrepreneur.fundingNeeded.toLocaleString()}</span>
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Link to={`/profile/entrepreneur/${entrepreneur._id}`} className="flex-1">
                      <Button size="sm" variant="outline" fullWidth>View Profile</Button>
                    </Link>
                    <Button
                      size="sm"
                      fullWidth
                      onClick={() => handleScheduleMeeting(entrepreneur._id, entrepreneur.name)}
                      isLoading={schedulingFor === entrepreneur._id}
                    >
                      Meet
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Recent Transactions */}
      {transactions.length > 0 && (
        <Card>
          <CardHeader className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">Recent Transactions</h2>
            <PieChart size={18} className="text-gray-400" />
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              {transactions.slice(0, 5).map(tx => (
                <div key={tx._id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{tx.description}</p>
                    <p className="text-xs text-gray-500">{tx.type} · {new Date(tx.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${tx.type === 'deposit' ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.type === 'deposit' ? '+' : '-'}${tx.amount}
                    </p>
                    <Badge variant={tx.status === 'completed' ? 'success' : tx.status === 'failed' ? 'error' : 'gray'} size="sm">
                      {tx.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
};
