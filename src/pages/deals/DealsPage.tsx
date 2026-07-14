import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, ArrowRightLeft, RefreshCw } from 'lucide-react';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { depositAPI, withdrawAPI, transferAPI, getTransactionsAPI, getBalanceAPI } from '../../api/payments';
import { getAllEntrepreneursAPI, getAllInvestorsAPI } from '../../api/users';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export const DealsPage: React.FC = () => {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [otherUsers, setOtherUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw' | 'transfer'>('deposit');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [receiverId, setReceiverId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [balanceRes, transactionsRes] = await Promise.all([
        getBalanceAPI(),
        getTransactionsAPI(),
      ]);
      setBalance(balanceRes.data.balance);
      setTransactions(transactionsRes.data);

      // Get other users for transfer
      if (user?.role === 'entrepreneur') {
        const res = await getAllInvestorsAPI();
        setOtherUsers(res.data);
      } else {
        const res = await getAllEntrepreneursAPI();
        setOtherUsers(res.data);
      }
    } catch {
      toast.error('Failed to load payment data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!amount || Number(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (activeTab === 'transfer' && !receiverId) {
      toast.error('Please select a receiver');
      return;
    }

    setIsProcessing(true);
    try {
      if (activeTab === 'deposit') {
        await depositAPI({ amount: Number(amount), description });
        toast.success(`Successfully deposited $${amount}`);
      } else if (activeTab === 'withdraw') {
        await withdrawAPI({ amount: Number(amount), description });
        toast.success(`Successfully withdrew $${amount}`);
      } else {
        await transferAPI({ receiverId, amount: Number(amount), description });
        toast.success(`Successfully transferred $${amount}`);
      }
      setAmount('');
      setDescription('');
      setReceiverId('');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Transaction failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payment Center</h1>
        <p className="text-gray-600">Manage your wallet and transactions</p>
      </div>

      {/* Balance Card */}
      <Card className="bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <CardBody>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-200 text-sm">Current Balance</p>
              <h2 className="text-4xl font-bold mt-1">${balance.toLocaleString()}</h2>
              <p className="text-primary-200 text-sm mt-2">{user?.name}'s Wallet</p>
            </div>
            <div className="p-4 bg-white bg-opacity-20 rounded-full">
              <DollarSign size={40} className="text-white" />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardBody>
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-full mr-3">
                <TrendingUp size={18} className="text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Deposits</p>
                <p className="text-lg font-semibold text-gray-900">
                  ${transactions.filter(t => t.type === 'deposit' && t.status === 'completed').reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-full mr-3">
                <TrendingDown size={18} className="text-red-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Withdrawals</p>
                <p className="text-lg font-semibold text-gray-900">
                  ${transactions.filter(t => t.type === 'withdrawal' && t.status === 'completed').reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-full mr-3">
                <ArrowRightLeft size={18} className="text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Transfers</p>
                <p className="text-lg font-semibold text-gray-900">
                  {transactions.filter(t => t.type === 'transfer').length}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transaction Form */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-medium text-gray-900">New Transaction</h2>
          </CardHeader>
          <CardBody>
            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-4">
              {(['deposit', 'withdraw', 'transfer'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
                    activeTab === tab
                      ? 'border-b-2 border-primary-600 text-primary-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              <Input
                label="Amount ($)"
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="Enter amount"
                fullWidth
                startAdornment={<DollarSign size={16} />}
              />

              {activeTab === 'transfer' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Send To</label>
                  <select
                    value={receiverId}
                    onChange={e => setReceiverId(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select recipient</option>
                    {otherUsers.map((u: any) => (
                      <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
                    ))}
                  </select>
                </div>
              )}

              <Input
                label="Description (optional)"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Add a note..."
                fullWidth
              />

              <Button
                fullWidth
                onClick={handleSubmit}
                isLoading={isProcessing}
                leftIcon={
                  activeTab === 'deposit' ? <TrendingUp size={16} /> :
                  activeTab === 'withdraw' ? <TrendingDown size={16} /> :
                  <ArrowRightLeft size={16} />
                }
              >
                {activeTab === 'deposit' ? 'Deposit Funds' :
                 activeTab === 'withdraw' ? 'Withdraw Funds' :
                 'Transfer Funds'}
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* Transaction History */}
        <Card>
          <CardHeader className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">Transaction History</h2>
            <Button variant="ghost" size="sm" onClick={fetchData}>
              <RefreshCw size={16} />
            </Button>
          </CardHeader>
          <CardBody>
            {isLoading ? (
              <p className="text-gray-500 text-center py-8">Loading...</p>
            ) : transactions.length === 0 ? (
              <div className="text-center py-8">
                <DollarSign size={40} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-600">No transactions yet</p>
                <p className="text-sm text-gray-500 mt-1">Make your first deposit to get started</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {transactions.map(tx => (
                  <div key={tx._id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center">
                      <div className={`p-2 rounded-full mr-3 ${
                        tx.type === 'deposit' ? 'bg-green-100' :
                        tx.type === 'withdrawal' ? 'bg-red-100' : 'bg-blue-100'
                      }`}>
                        {tx.type === 'deposit' ? <TrendingUp size={14} className="text-green-600" /> :
                         tx.type === 'withdrawal' ? <TrendingDown size={14} className="text-red-600" /> :
                         <ArrowRightLeft size={14} className="text-blue-600" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{tx.description}</p>
                        <p className="text-xs text-gray-500">
                          {tx.type} · {new Date(tx.createdAt).toLocaleDateString()}
                        </p>
                        {tx.sender && tx.type === 'transfer' && (
                          <p className="text-xs text-gray-400">
                            {tx.sender._id === (user?.id) ? `To: ${tx.receiver?.name}` : `From: ${tx.sender?.name}`}
                          </p>
                        )}
                        <p className="text-xs text-gray-400">Ref: {tx.referenceId}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${
                        tx.type === 'deposit' ? 'text-green-600' :
                        tx.type === 'withdrawal' ? 'text-red-600' : 'text-blue-600'
                      }`}>
                        {tx.type === 'deposit' ? '+' : '-'}${tx.amount.toLocaleString()}
                      </p>
                      <Badge
                        variant={tx.status === 'completed' ? 'success' : tx.status === 'failed' ? 'error' : 'gray'}
                        size="sm"
                      >
                        {tx.status}
                      </Badge>
                    </div>
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
