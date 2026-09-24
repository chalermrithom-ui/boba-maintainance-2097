/**
 * ============================================================================
 * FIXFLOW AUTHENTICATION & USER MANAGEMENT SERVICE
 * ============================================================================
 *
 * Provides complete authentication, password rules, user CRUD, suspension,
 * and role-based access checks for Admin and Technician accounts.
 *
 * --- FIREBASE MIGRATION READY ARCHITECTURE ---
 * 1. Firebase Authentication uses email and password for credential verification.
 * 2. In Firestore, user profiles are stored under `/users/{userId}`:
 *    {
 *      id: string,
 *      loginId: string, // indexed with unique constraint via security rules
 *      name: string,
 *      email: string,
 *      role: 'admin' | 'technician',
 *      status: 'active' | 'suspended' | 'deleted',
 *      mustChangePassword: boolean,
 *      ...
 *    }
 * 3. When a user logs in using their Login ID:
 *    - Query Firestore collection 'users' where `loginId == cleanLoginId`
 *    - Retrieve the associated email address
 *    - Call Firebase Auth: `signInWithEmailAndPassword(auth, email, password)`
 * 4. Passwords are NEVER stored in Firestore.
 * 5. Firebase Custom Claims or Firestore Security Rules enforce:
 *    `match /users/{document=**} { allow write: if request.auth.token.role == 'admin'; }`
 * ============================================================================
 */

import { User, AuthSession, FixFlowRole, UserStatus, ViewerPermissions } from '../types';

const AUTH_SESSION_KEY = 'fixflow_auth_session_v2';
const REMEMBER_ME_KEY = 'fixflow_remember_me_v2';
const USERS_DB_KEY = 'fixflow_users_database_v2';
const PASSWORDS_DB_KEY = 'fixflow_passwords_vault_v2';

export interface LoginResult {
  success: boolean;
  user?: User;
  errorMessage?: string;
  errorMessageEn?: string;
  mustChangePassword?: boolean;
}

export interface PasswordValidationResult {
  valid: boolean;
  error?: string;
  errorEn?: string;
  strength: 'weak' | 'fair' | 'strong';
  criteria: {
    minLength: boolean;
    hasLetter: boolean;
    hasNumber: boolean;
    hasSpecialOrMixed: boolean;
  };
}

export interface CreateUserDTO {
  name: string;
  nameTh?: string;
  nameEn?: string;
  displayName?: string;
  loginId: string;
  email: string;
  phone?: string;
  lineId?: string;
  password: string;
  role: FixFlowRole;
  status?: UserStatus;
  preferredLanguage?: 'th' | 'en';
  avatarUrl?: string;
  viewerPermissions?: ViewerPermissions;
  internalNote?: string;
  isTemporaryPassword?: boolean;
}

// Initial seed accounts for Phase 1: 2 Admins, 2 Technicians, 2 Viewers
const INITIAL_USERS: User[] = [
  {
    id: 'usr_admin_01',
    loginId: 'admin.fixflow',
    name: 'คุณแอดมิน (ผู้ดูแลระบบหลัก)',
    displayName: 'คุณแอดมิน',
    nameTh: 'คุณแอดมิน',
    nameEn: 'Admin Primary',
    email: 'admin@fixflow.local',
    phone: '02-987-6543',
    role: 'admin',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80',
    preferredLanguage: 'th',
    status: 'active',
    active: true,
    mustChangePassword: false,
    lastLoginAt: '2026-09-20 08:30',
    createdAt: '2026-01-01 08:00',
    updatedAt: '2026-01-01 08:00',
  },
  {
    id: 'usr_admin_02',
    loginId: 'manager.fixflow',
    name: 'ผู้ดูแลสำรอง (รองผู้ดูแลระบบ)',
    displayName: 'ผู้ดูแลสำรอง',
    nameTh: 'ผู้ดูแลสำรอง',
    nameEn: 'Backup Manager',
    email: 'manager@fixflow.local',
    phone: '02-987-6544',
    role: 'admin',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=160&q=80',
    preferredLanguage: 'th',
    status: 'active',
    active: true,
    mustChangePassword: false,
    lastLoginAt: '2026-09-18 14:20',
    createdAt: '2026-01-05 08:00',
    updatedAt: '2026-01-05 08:00',
  },
  {
    id: 'usr_tech_01',
    loginId: 'somchai.tech',
    name: 'สมชาย ช่างแอร์',
    displayName: 'สมชาย ช่างแอร์',
    nameTh: 'สมชาย ช่างแอร์',
    nameEn: 'Somchai HVAC Tech',
    email: 'somchai@fixflow.local',
    phone: '089-765-4321',
    lineId: 'somchai_air',
    role: 'technician',
    avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=160&q=80',
    preferredLanguage: 'th',
    status: 'active',
    active: true,
    mustChangePassword: false,
    lastLoginAt: '2026-09-19 16:45',
    createdAt: '2026-01-01 08:00',
    updatedAt: '2026-01-01 08:00',
  },
  {
    id: 'usr_tech_02',
    loginId: 'wichai.tech',
    name: 'วิชัย ช่างประปา',
    displayName: 'วิชัย ช่างประปา',
    nameTh: 'วิชัย ช่างประปา',
    nameEn: 'Wichai Plumbing Tech',
    email: 'wichai@fixflow.local',
    phone: '084-555-1212',
    lineId: 'wichai_pipe',
    role: 'technician',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80',
    preferredLanguage: 'th',
    status: 'active',
    active: true,
    mustChangePassword: false,
    lastLoginAt: '2026-09-18 10:10',
    createdAt: '2026-01-10 09:00',
    updatedAt: '2026-01-10 09:00',
  },
  {
    id: 'usr_viewer_01',
    loginId: 'viewer.fixflow',
    name: 'ผู้ดูบัญชี (Auditor)',
    displayName: 'ผู้ดูบัญชี',
    nameTh: 'ผู้ดูบัญชี',
    nameEn: 'Audit Viewer',
    email: 'viewer@fixflow.local',
    phone: '085-111-2233',
    role: 'viewer',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=160&q=80',
    preferredLanguage: 'th',
    status: 'active',
    active: true,
    mustChangePassword: false,
    viewerPermissions: {
      viewAllJobs: true,
      viewAssignedJobsOnly: false,
      canViewQuotations: false,
      canViewPayments: false,
      canViewReports: true,
      canViewCustomers: true,
      canViewSellingPrices: false,
    },
    internalNote: 'ฝ่ายตรวจสอบบัญชีและเอกสาร ได้รับสิทธิ์ดูข้อมูลงานและรายงานแบบอ่านอย่างเดียว',
    lastLoginAt: '2026-09-20 11:00',
    createdAt: '2026-02-01 08:00',
    updatedAt: '2026-02-01 08:00',
  },
  {
    id: 'usr_viewer_02',
    loginId: 'partner.fixflow',
    name: 'หุ้นส่วนกิจการ (Business Partner)',
    displayName: 'หุ้นส่วนกิจการ',
    nameTh: 'หุ้นส่วนกิจการ',
    nameEn: 'Partner Viewer',
    email: 'partner@fixflow.local',
    phone: '081-999-8877',
    role: 'viewer',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80',
    preferredLanguage: 'th',
    status: 'active',
    active: true,
    mustChangePassword: false,
    viewerPermissions: {
      viewAllJobs: true,
      viewAssignedJobsOnly: false,
      canViewQuotations: false,
      canViewPayments: false,
      canViewReports: true,
      canViewCustomers: true,
      canViewSellingPrices: false,
    },
    internalNote: 'หุ้นส่วนกิจการ ดูสรุปแดชบอร์ดและความคืบหน้างานซ่อมทั่วไป',
    lastLoginAt: '2026-09-17 15:30',
    createdAt: '2026-02-15 08:00',
    updatedAt: '2026-02-15 08:00',
  },
];

// Seed initial passwords vault (supports demo password 12345678)
const INITIAL_PASSWORDS: Record<string, string> = {
  usr_admin_01: '12345678',
  usr_admin_02: '12345678',
  usr_tech_01: '12345678',
  usr_tech_02: '12345678',
  usr_viewer_01: '12345678',
  usr_viewer_02: '12345678',
};

export const AuthService = {
  /**
   * Internal: Initialize and retrieve users from localStorage
   */
  getUsers(): User[] {
    try {
      const stored = localStorage.getItem(USERS_DB_KEY);
      if (stored) {
        return JSON.parse(stored) as User[];
      }
    } catch (e) {
      console.error('Failed to load users from storage', e);
    }

    // First time bootstrap
    localStorage.setItem(USERS_DB_KEY, JSON.stringify(INITIAL_USERS));
    localStorage.setItem(PASSWORDS_DB_KEY, JSON.stringify(INITIAL_PASSWORDS));
    return INITIAL_USERS;
  },

  /**
   * Save users list to localStorage
   */
  saveUsers(users: User[]): void {
    try {
      localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
    } catch (e) {
      console.error('Failed to save users to storage', e);
    }
  },

  /**
   * Internal: Passwords storage (for prototype simulation)
   */
  getPasswordsVault(): Record<string, string> {
    try {
      const stored = localStorage.getItem(PASSWORDS_DB_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {}
    return INITIAL_PASSWORDS;
  },

  savePasswordsVault(vault: Record<string, string>): void {
    try {
      localStorage.setItem(PASSWORDS_DB_KEY, JSON.stringify(vault));
    } catch {}
  },

  /**
   * Get single user by ID
   */
  getUserById(id: string): User | null {
    const users = this.getUsers();
    return users.find((u) => u.id === id) || null;
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  },

  /**
   * Get currently logged-in user
   */
  getCurrentUser(): User | null {
    try {
      const stored = localStorage.getItem(AUTH_SESSION_KEY) || sessionStorage.getItem(AUTH_SESSION_KEY);
      if (!stored) return null;
      const parsed = JSON.parse(stored) as User;

      // Always return latest status from DB
      const current = this.getUserById(parsed.id);
      return current || parsed;
    } catch {
      return null;
    }
  },

  /**
   * Get current auth session metadata
   */
  getCurrentSession(): AuthSession | null {
    const user = this.getCurrentUser();
    if (!user) return null;
    return {
      userId: user.id,
      loginId: user.loginId,
      role: user.role === 'resident' ? 'technician' : user.role,
      preferredLanguage: user.preferredLanguage || 'th',
      loginAt: user.lastLoginAt || new Date().toISOString(),
    };
  },

  /**
   * Validate Login ID rules:
   * - Unique
   * - English letters, numbers, dot, dash, underscore: a-z, 0-9, ., -, _
   * - Length 4-30 chars
   * - No spaces
   */
  validateLoginId(loginId: string, excludeUserId?: string): { valid: boolean; error?: string; errorEn?: string } {
    const clean = (loginId || '').trim().toLowerCase();

    if (!clean) {
      return {
        valid: false,
        error: 'กรุณาระบุ Login ID',
        errorEn: 'Login ID is required',
      };
    }

    if (/\s/.test(loginId)) {
      return {
        valid: false,
        error: 'Login ID ต้องไม่มีช่องว่าง',
        errorEn: 'Login ID cannot contain spaces',
      };
    }

    if (clean.length < 4 || clean.length > 30) {
      return {
        valid: false,
        error: 'Login ID ต้องมีความยาวระหว่าง 4 ถึง 30 ตัวอักษร',
        errorEn: 'Login ID must be between 4 and 30 characters',
      };
    }

    // Allowed chars regex
    const validPattern = /^[a-z0-9._-]+$/;
    if (!validPattern.test(clean)) {
      return {
        valid: false,
        error: 'Login ID ต้องประกอบด้วยตัวอักษรภาษาอังกฤษ ตัวเลข จุด (.) ขีดกลาง (-) หรือขีดล่าง (_) เท่านั้น',
        errorEn: 'Login ID can only contain lowercase letters, numbers, dot (.), hyphen (-), or underscore (_)',
      };
    }

    // Uniqueness check (ignoring soft-deleted users if desired, but best to keep unique)
    const users = this.getUsers();
    const existing = users.find(
      (u) => u.loginId.toLowerCase() === clean && u.id !== excludeUserId && u.status !== 'deleted'
    );

    if (existing) {
      return {
        valid: false,
        error: `Login ID "${clean}" ถูกใช้งานแล้วในระบบ กรุณาเลือกชื่ออื่น`,
        errorEn: `Login ID "${clean}" is already in use. Please choose another.`,
      };
    }

    return { valid: true };
  },

  /**
   * Check real-time availability of Login ID
   */
  checkLoginIdAvailability(loginId: string, currentUserId?: string): boolean {
    const res = this.validateLoginId(loginId, currentUserId);
    return res.valid;
  },

  /**
   * Validate Password rules:
   * - At least 8 characters
   * - At least 1 English letter and 1 number
   * - Strength indicator
   */
  validatePassword(password: string): PasswordValidationResult {
    const str = password || '';
    const minLength = str.length >= 8;
    const hasLetter = /[a-zA-Z]/.test(str);
    const hasNumber = /[0-9]/.test(str);
    const hasSpecialOrMixed = /[^a-zA-Z0-9]/.test(str) || (/[a-z]/.test(str) && /[A-Z]/.test(str));

    const criteria = {
      minLength,
      hasLetter,
      hasNumber,
      hasSpecialOrMixed,
    };

    let strength: 'weak' | 'fair' | 'strong' = 'weak';
    if (minLength && hasLetter && hasNumber) {
      strength = hasSpecialOrMixed && str.length >= 10 ? 'strong' : 'fair';
    }

    if (!minLength) {
      return {
        valid: false,
        error: 'รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร',
        errorEn: 'Password must be at least 8 characters long',
        strength,
        criteria,
      };
    }

    if (!hasLetter || !hasNumber) {
      return {
        valid: false,
        error: 'รหัสผ่านต้องมีทั้งตัวอักษรภาษาอังกฤษและตัวเลขอย่างน้อย 1 ตัว',
        errorEn: 'Password must contain at least one letter and one number',
        strength,
        criteria,
      };
    }

    return {
      valid: true,
      strength,
      criteria,
    };
  },

  /**
   * Authenticate user with Login ID or Email and password
   */
  login(identifier: string, password: string, rememberMe = true): LoginResult {
    const cleanId = (identifier || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    if (!cleanId) {
      return {
        success: false,
        errorMessage: 'กรุณาระบุ Login ID หรืออีเมล',
        errorMessageEn: 'Please enter Login ID or email',
      };
    }
    if (!cleanPass) {
      return {
        success: false,
        errorMessage: 'กรุณาระบุรหัสผ่าน',
        errorMessageEn: 'Please enter password',
      };
    }

    const users = this.getUsers();

    // Search user by loginId or email
    const user = users.find(
      (u) => u.loginId.toLowerCase() === cleanId || u.email.toLowerCase() === cleanId
    );

    if (!user || user.status === 'deleted') {
      return {
        success: false,
        errorMessage: 'Login ID / อีเมล หรือรหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบและลองใหม่อีกครั้ง',
        errorMessageEn: 'Invalid Login ID/email or password. Please check and try again.',
      };
    }

    // Check account status: SUSPENDED
    if (user.status === 'suspended') {
      return {
        success: false,
        errorMessage:
          'บัญชีนี้ถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ / This account has been suspended. Please contact the administrator.',
        errorMessageEn: 'This account has been suspended. Please contact the administrator.',
      };
    }

    // Verify Password
    const vault = this.getPasswordsVault();
    const storedPass = vault[user.id] || '123456';

    // Allow universal demo testing passwords '12345678' or '123456' or exact matching password
    const isCorrect = cleanPass === storedPass || cleanPass === '12345678' || cleanPass === '123456';

    if (!isCorrect) {
      return {
        success: false,
        errorMessage: 'Login ID / อีเมล หรือรหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบและลองใหม่อีกครั้ง',
        errorMessageEn: 'Invalid Login ID/email or password. Please check and try again.',
      };
    }

    // Update lastLoginAt
    const nowStr = new Date().toISOString().slice(0, 16).replace('T', ' ');
    user.lastLoginAt = nowStr;
    this.saveUsers(users);

    // Persist session
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem(AUTH_SESSION_KEY, JSON.stringify(user));

    if (rememberMe) {
      localStorage.setItem(REMEMBER_ME_KEY, cleanId);
    } else {
      localStorage.removeItem(REMEMBER_ME_KEY);
    }

    return {
      success: true,
      user,
      mustChangePassword: user.mustChangePassword,
    };
  },

  /**
   * Direct switch user (useful for admin testing)
   */
  switchUser(user: User): void {
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(user));
  },

  /**
   * Log out
   */
  logout(): void {
    localStorage.removeItem(AUTH_SESSION_KEY);
    sessionStorage.removeItem(AUTH_SESSION_KEY);
  },

  /**
   * Get saved remember-me identifier
   */
  getRememberedIdentifier(): string {
    return localStorage.getItem(REMEMBER_ME_KEY) || '';
  },

  /**
   * Admin: Create new user account (Admin or Technician)
   */
  createUser(dto: CreateUserDTO): { success: boolean; user?: User; error?: string; errorEn?: string } {
    // 1. Validate Login ID
    const loginIdValidation = this.validateLoginId(dto.loginId);
    if (!loginIdValidation.valid) {
      return {
        success: false,
        error: loginIdValidation.error,
        errorEn: loginIdValidation.errorEn,
      };
    }

    // 2. Validate Email
    const cleanEmail = dto.email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return {
        success: false,
        error: 'กรุณาระบุอีเมลที่ถูกต้อง',
        errorEn: 'Please provide a valid email address',
      };
    }

    const users = this.getUsers();
    if (users.some((u) => u.email.toLowerCase() === cleanEmail && u.status !== 'deleted')) {
      return {
        success: false,
        error: `อีเมล "${cleanEmail}" มีอยู่ในระบบแล้ว`,
        errorEn: `Email "${cleanEmail}" already exists in the system`,
      };
    }

    // 3. Validate Password
    const passwordValidation = this.validatePassword(dto.password);
    if (!passwordValidation.valid) {
      return {
        success: false,
        error: passwordValidation.error,
        errorEn: passwordValidation.errorEn,
      };
    }

    const nowStr = new Date().toISOString().slice(0, 16).replace('T', ' ');
    const prefix = dto.role === 'admin' ? 'adm' : dto.role === 'viewer' ? 'view' : 'tech';
    const newUserId = `usr_${prefix}_${Date.now().toString(36)}`;

    const newUser: User = {
      id: newUserId,
      loginId: dto.loginId.trim().toLowerCase(),
      name: dto.name.trim(),
      displayName: dto.displayName?.trim() || dto.name.trim(),
      nameTh: dto.nameTh?.trim(),
      nameEn: dto.nameEn?.trim(),
      email: cleanEmail,
      phone: dto.phone?.trim() || undefined,
      lineId: dto.lineId?.trim() || undefined,
      role: dto.role,
      avatarUrl: dto.avatarUrl || this.getDefaultAvatar(dto.role, dto.name),
      preferredLanguage: dto.preferredLanguage || 'th',
      status: dto.status || 'active',
      active: (dto.status || 'active') === 'active',
      viewerPermissions: dto.role === 'viewer' ? (dto.viewerPermissions || {
        viewAllJobs: true,
        viewAssignedJobsOnly: false,
        canViewQuotations: true,
        canViewPayments: false,
        canViewReports: true,
        canViewCustomers: true,
        canViewSellingPrices: false,
      }) : undefined,
      internalNote: dto.internalNote?.trim(),
      mustChangePassword: dto.isTemporaryPassword !== false,
      createdAt: nowStr,
      updatedAt: nowStr,
    };

    // Save user & password
    users.push(newUser);
    this.saveUsers(users);

    const vault = this.getPasswordsVault();
    vault[newUserId] = dto.password.trim();
    this.savePasswordsVault(vault);

    return { success: true, user: newUser };
  },

  /**
   * Safety check: Check if an Admin can be suspended, deleted, or demoted
   */
  canDemoteOrDeleteAdmin(userId: string): { allowed: boolean; messageTh: string; messageEn: string } {
    const users = this.getUsers();
    const target = users.find((u) => u.id === userId);
    if (!target || target.role !== 'admin') {
      return { allowed: true, messageTh: '', messageEn: '' };
    }
    const activeAdmins = users.filter((u) => u.role === 'admin' && u.status === 'active' && u.id !== userId);
    if (activeAdmins.length === 0) {
      return {
        allowed: false,
        messageTh: 'ไม่สามารถระงับ ลบ หรือเปลี่ยนบทบาทของ Admin บัญชีสุดท้ายในระบบได้ (ต้องมี Admin อย่างน้อย 1 บัญชีเสมอ)',
        messageEn: 'Cannot suspend, delete, or change the role of the last active Admin (at least 1 active Admin is required).',
      };
    }
    return { allowed: true, messageTh: '', messageEn: '' };
  },

  /**
   * Admin: Change user role with required audit note
   */
  changeRole(
    userId: string,
    newRole: FixFlowRole,
    reason: string,
    viewerPermissions?: ViewerPermissions
  ): { success: boolean; user?: User; error?: string; errorEn?: string } {
    if (!reason || reason.trim().length === 0) {
      return {
        success: false,
        error: 'กรุณาระบุเหตุผลหรือบันทึกภายในสำหรับการเปลี่ยนบทบาท',
        errorEn: 'A reason is required when modifying user role',
      };
    }

    if (newRole !== 'admin') {
      const check = this.canDemoteOrDeleteAdmin(userId);
      if (!check.allowed) {
        return {
          success: false,
          error: check.messageTh,
          errorEn: check.messageEn,
        };
      }
    }

    const updates: Partial<User> = {
      role: newRole,
      internalNote: `[${new Date().toISOString().slice(0, 10)}] เปลี่ยนบทบาทเป็น ${newRole}: ${reason.trim()}`,
    };

    if (newRole === 'viewer') {
      updates.viewerPermissions = viewerPermissions || {
        viewAllJobs: true,
        viewAssignedJobsOnly: false,
        canViewQuotations: true,
        canViewPayments: false,
        canViewReports: true,
        canViewCustomers: true,
        canViewSellingPrices: false,
      };
    }

    return this.updateUser(userId, updates);
  },

  /**
   * Admin: Update user details
   */
  updateUser(
    id: string,
    updates: Partial<Omit<User, 'id' | 'createdAt'>>
  ): { success: boolean; user?: User; error?: string; errorEn?: string } {
    const users = this.getUsers();
    const index = users.findIndex((u) => u.id === id);
    if (index === -1) {
      return {
        success: false,
        error: 'ไม่พบผู้ใช้งานในระบบ',
        errorEn: 'User not found',
      };
    }

    const current = users[index];

    // If updating loginId, validate uniqueness
    if (updates.loginId && updates.loginId.toLowerCase() !== current.loginId.toLowerCase()) {
      const v = this.validateLoginId(updates.loginId, current.id);
      if (!v.valid) {
        return { success: false, error: v.error, errorEn: v.errorEn };
      }
      updates.loginId = updates.loginId.trim().toLowerCase();
    }

    // If updating email, check uniqueness
    if (updates.email && updates.email.toLowerCase() !== current.email.toLowerCase()) {
      const cleanEmail = updates.email.trim().toLowerCase();
      if (users.some((u) => u.id !== id && u.email.toLowerCase() === cleanEmail && u.status !== 'deleted')) {
        return {
          success: false,
          error: `อีเมล "${cleanEmail}" มีอยู่ในระบบแล้ว`,
          errorEn: `Email "${cleanEmail}" is already used by another user`,
        };
      }
      updates.email = cleanEmail;
    }

    const nowStr = new Date().toISOString().slice(0, 16).replace('T', ' ');
    const updatedUser: User = {
      ...current,
      ...updates,
      updatedAt: nowStr,
    };

    if (updates.status) {
      updatedUser.active = updates.status === 'active';
    }

    users[index] = updatedUser;
    this.saveUsers(users);

    // If currently logged in user was updated, refresh session
    const currentSessionUser = this.getCurrentUser();
    if (currentSessionUser && currentSessionUser.id === id) {
      localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(updatedUser));
    }

    return { success: true, user: updatedUser };
  },

  /**
   * Admin: Suspend User
   */
  suspendUser(id: string): { success: boolean; user?: User; error?: string } {
    return this.updateUser(id, { status: 'suspended', active: false });
  },

  /**
   * Admin: Reactivate User
   */
  reactivateUser(id: string): { success: boolean; user?: User; error?: string } {
    return this.updateUser(id, { status: 'active', active: true });
  },

  /**
   * Admin: Soft Delete User (Keeps history intact)
   */
  deleteUser(id: string): { success: boolean; error?: string } {
    const users = this.getUsers();
    const user = users.find((u) => u.id === id);
    if (!user) {
      return { success: false, error: 'ไม่พบผู้ใช้ที่ต้องการลบ' };
    }

    if (user.role === 'admin') {
      const activeAdmins = users.filter((u) => u.role === 'admin' && u.status === 'active' && u.id !== id);
      if (activeAdmins.length === 0) {
        return { success: false, error: 'ไม่สามารถลบ Admin บัญชีสุดท้ายของระบบได้' };
      }
    }

    const res = this.updateUser(id, { status: 'deleted', active: false });
    return { success: res.success, error: res.error };
  },

  /**
   * Admin: Reset Password -> Sets temporary password and sets mustChangePassword = true
   */
  resetPassword(
    userId: string,
    tempPassword?: string
  ): { success: boolean; temporaryPassword?: string; error?: string } {
    const user = this.getUserById(userId);
    if (!user) {
      return { success: false, error: 'ไม่พบผู้ใช้งาน' };
    }

    const newTemp = tempPassword || this.generateTemporaryPassword();
    const vault = this.getPasswordsVault();
    vault[userId] = newTemp;
    this.savePasswordsVault(vault);

    // Update user to require password change
    this.updateUser(userId, { mustChangePassword: true });

    return {
      success: true,
      temporaryPassword: newTemp,
    };
  },

  /**
   * User: Change Password (e.g. from Profile or on First-Time login)
   */
  changePassword(
    userId: string,
    newPassword: string,
    oldPassword?: string
  ): { success: boolean; error?: string; errorEn?: string } {
    const user = this.getUserById(userId);
    if (!user) {
      return { success: false, error: 'ไม่พบผู้ใช้งาน', errorEn: 'User not found' };
    }

    // Check old password if provided and not in mustChangePassword mode
    const vault = this.getPasswordsVault();
    if (oldPassword) {
      const currentStored = vault[userId] || '123456';
      if (oldPassword !== currentStored && oldPassword !== '123456') {
        return {
          success: false,
          error: 'รหัสผ่านปัจจุบันไม่ถูกต้อง',
          errorEn: 'Current password is incorrect',
        };
      }
    }

    // Validate new password rules
    const v = this.validatePassword(newPassword);
    if (!v.valid) {
      return { success: false, error: v.error, errorEn: v.errorEn };
    }

    vault[userId] = newPassword.trim();
    this.savePasswordsVault(vault);

    // Clear mustChangePassword
    this.updateUser(userId, { mustChangePassword: false });

    return { success: true };
  },

  /**
   * Helper: Generate a secure temporary password (e.g., FixFlow#8291)
   */
  generateTemporaryPassword(): string {
    const prefixes = ['Fix', 'Flow', 'Tech', 'Pro', 'Safe'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const num = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}#${num}`;
  },

  /**
   * Helper: Default avatars
   */
  getDefaultAvatar(role: 'admin' | 'technician', name: string): string {
    if (role === 'admin') {
      return 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80';
    }
    const techAvatars = [
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=160&q=80',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80',
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=160&q=80',
      'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=160&q=80',
    ];
    return techAvatars[Math.floor(Math.random() * techAvatars.length)];
  },

  /**
   * Request password reset instructions (MVP simulator)
   */
  requestPasswordReset(identifier: string): { success: boolean; message: string } {
    const clean = (identifier || '').trim().toLowerCase();
    const users = this.getUsers();
    const user = users.find(
      (u) => u.loginId.toLowerCase() === clean || u.email.toLowerCase() === clean
    );

    if (user && user.status !== 'deleted') {
      return {
        success: true,
        message: `ระบบได้รับคำขอแล้ว สำหรับเวอร์ชัน MVP หากลืมรหัสผ่าน กรุณาแจ้งผู้ดูแลระบบ (Admin) เพื่อทำการรีเซ็ตรหัสผ่านชั่วคราวให้ผ่านเมนูจัดการผู้ใช้งาน (หรือเข้าสู่ระบบด้วยรหัสผ่านทดสอบ 123456)`,
      };
    }

    return {
      success: false,
      message: 'ไม่พบ Login ID หรืออีเมลนี้ในระบบ กรุณาตรวจสอบอีกครั้งหรือติดต่อผู้ดูแลระบบ',
    };
  },

  /**
   * Role permissions
   */
  isAdmin(user: User | null): boolean {
    return user?.role === 'admin';
  },

  isTechnician(user: User | null): boolean {
    return user?.role === 'technician';
  },

  canManageUsers(user: User | null): boolean {
    return user?.role === 'admin';
  },
};
