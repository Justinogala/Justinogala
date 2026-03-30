
import bcrypt from 'bcryptjs';

const ADMIN_SESSION_KEY = 'munal_admin_session';
const ADMIN_DATA_KEY = 'munal_admin_data';

// Default credentials for initialization
const DEFAULT_ADMIN = {
  email: 'admin@munal.ai',
  passwordPlain: 'Admin@123456', 
  name: 'System Administrator'
};

/**
 * Initializes the admin account with a hashed password if it doesn't exist.
 */
const initializeAdmin = async () => {
  try {
    const existingData = localStorage.getItem(ADMIN_DATA_KEY);
    if (!existingData) {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(DEFAULT_ADMIN.passwordPlain, salt);
      
      const adminRecord = {
        id: 'admin-001',
        email: DEFAULT_ADMIN.email,
        passwordHash: hash,
        name: DEFAULT_ADMIN.name,
        createdAt: new Date().toISOString()
      };
      
      localStorage.setItem(ADMIN_DATA_KEY, JSON.stringify(adminRecord));
      console.log('Admin account initialized successfully');
    }
  } catch (error) {
    console.error('Failed to initialize admin account:', error);
  }
};

/**
 * Authenticates admin user
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<Object>} Session object
 */
const adminLogin = async (email, password) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Ensure initialization happened
  await initializeAdmin();

  const storedData = localStorage.getItem(ADMIN_DATA_KEY);
  if (!storedData) {
    throw new Error('Admin account not found. Please refresh the page.');
  }

  const adminRecord = JSON.parse(storedData);

  // 1. Validate Email
  if (email.toLowerCase() !== adminRecord.email.toLowerCase()) {
    throw new Error('Invalid email or password');
  }

  // 2. Validate Password
  const isMatch = await bcrypt.compare(password, adminRecord.passwordHash);
  if (!isMatch) {
    throw new Error('Invalid email or password');
  }

  // 3. Create Session
  const session = {
    token: `admin_tk_${Date.now()}_${Math.random().toString(36).substr(2)}`,
    user: {
      id: adminRecord.id,
      email: adminRecord.email,
      name: adminRecord.name
    },
    loginTime: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
  };

  localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
  return session.user;
};

/**
 * Retrieves current valid session
 * @returns {Object|null}
 */
const getAdminSession = () => {
  try {
    const sessionStr = localStorage.getItem(ADMIN_SESSION_KEY);
    if (!sessionStr) return null;

    const session = JSON.parse(sessionStr);
    
    // Check expiration
    if (new Date(session.expiresAt) < new Date()) {
      localStorage.removeItem(ADMIN_SESSION_KEY);
      return null;
    }

    return session.user;
  } catch (error) {
    localStorage.removeItem(ADMIN_SESSION_KEY);
    return null;
  }
};

/**
 * Logs out the admin
 */
const logoutAdmin = () => {
  localStorage.removeItem(ADMIN_SESSION_KEY);
};

// Export as named object
export const adminAuthService = {
  initialize: initializeAdmin,
  login: adminLogin,
  getSession: getAdminSession,
  logout: logoutAdmin
};
