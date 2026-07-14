const Transaction = require('../models/Transaction');
const User = require('../models/User');

const generateReferenceId = () => {
  return `MOCK-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
};

// @desc    Deposit money
// @route   POST /api/payments/deposit
const deposit = async (req, res) => {
  try {
    const { amount, description } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Valid amount is required' });
    }

    const transaction = await Transaction.create({
      receiver: req.user._id,
      type: 'deposit',
      amount,
      status: 'pending',
      description: description || 'Deposit',
      referenceId: generateReferenceId(),
    });

    // Update user balance
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { balance: amount },
    });

    transaction.status = 'completed';
    await transaction.save();

    res.status(201).json({
      message: `Successfully deposited $${amount}`,
      transaction,
      newBalance: req.user.balance + amount,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Withdraw money
// @route   POST /api/payments/withdraw
const withdraw = async (req, res) => {
  try {
    const { amount, description } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Valid amount is required' });
    }

    // Check sufficient balance
    const user = await User.findById(req.user._id);
    if (user.balance < amount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    const transaction = await Transaction.create({
      sender: req.user._id,
      type: 'withdrawal',
      amount,
      status: 'pending',
      description: description || 'Withdrawal',
      referenceId: generateReferenceId(),
    });

    // Deduct from balance
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { balance: -amount },
    });

    transaction.status = 'completed';
    await transaction.save();

    res.status(201).json({
      message: `Successfully withdrew $${amount}`,
      transaction,
      newBalance: user.balance - amount,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Transfer money to another user
// @route   POST /api/payments/transfer
const transfer = async (req, res) => {
  try {
    const { receiverId, amount, description } = req.body;

    if (!receiverId || !amount || amount <= 0) {
      return res.status(400).json({ message: 'Receiver and valid amount are required' });
    }

    if (receiverId === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot transfer to yourself' });
    }

    // Check sender balance
    const sender = await User.findById(req.user._id);
    if (sender.balance < amount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    // Check receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: 'Receiver not found' });
    }

    const referenceId = generateReferenceId();

    const transaction = await Transaction.create({
      sender: req.user._id,
      receiver: receiverId,
      type: 'transfer',
      amount,
      status: 'pending',
      description: description || `Transfer to ${receiver.name}`,
      referenceId,
    });

    // Deduct from sender
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { balance: -amount },
    });

    // Add to receiver
    await User.findByIdAndUpdate(receiverId, {
      $inc: { balance: amount },
    });

    transaction.status = 'completed';
    await transaction.save();

    res.status(201).json({
      message: `Successfully transferred $${amount} to ${receiver.name}`,
      transaction,
      newBalance: sender.balance - amount,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get transaction history
// @route   GET /api/payments/transactions
const getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({
      $or: [
        { sender: req.user._id },
        { receiver: req.user._id },
      ],
    })
      .populate('sender', 'name email')
      .populate('receiver', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json(transactions);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get balance
// @route   GET /api/payments/balance
const getBalance = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('balance name email');
    res.status(200).json({ balance: user.balance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { deposit, withdraw, transfer, getTransactions, getBalance };