export type UserRole = 'entrepreneur' | 'investor';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl: string;
  bio: string;
  isOnline?: boolean;
  createdAt: string;
  balance?: number;
  location?: string;
  phone?: string;
  website?: string;
  // Entrepreneur fields
  startupName?: string;
  startupStage?: string;
  industry?: string;
  fundingNeeded?: number;
  pitchDeck?: string;
  pitchSummary?: string;
  foundedYear?: number;
  teamSize?: number;
  // Investor fields
  investmentFocus?: string[];
  investmentInterests?: string[];
  investmentStage?: string[];
  minimumInvestment?: number;
  maximumInvestment?: number;
  portfolioCompanies?: string[];
  preferredStages?: string[];
  totalInvestments?: number;
  // Connection fields
  connections?: string[];
  pendingRequests?: string[];
}

export interface Entrepreneur extends User {
  role: 'entrepreneur';
}

export interface Investor extends User {
  role: 'investor';
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  isRead: boolean;
}

export interface ChatConversation {
  id: string;
  participants: string[];
  lastMessage?: Message;
  updatedAt: string;
}

export interface CollaborationRequest {
  id: string;
  investorId: string;
  entrepreneurId: string;
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface Document {
  id: string;
  name: string;
  type: string;
  size: string;
  lastModified: string;
  shared: boolean;
  url: string;
  ownerId: string;
}

export interface Meeting {
  _id: string;
  organizer: User;
  attendee: User;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  meetingLink?: string;
}

export interface Transaction {
  _id: string;
  sender?: User;
  receiver?: User;
  type: 'deposit' | 'withdrawal' | 'transfer';
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  description: string;
  referenceId: string;
  createdAt: string;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: UserRole) => Promise<void>;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  updateProfile: (userId: string, updates: Partial<User>) => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}
