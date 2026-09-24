import { ShareLink, GuestApproval } from '../types';

const SHARE_LINKS_KEY = 'fixflow_share_links_v1';
const GUEST_APPROVALS_KEY = 'fixflow_guest_approvals_v1';

// Cryptographically secure random token generator
function generateSecureToken(length = 40): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let token = '';
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const values = new Uint32Array(length);
    window.crypto.getRandomValues(values);
    for (let i = 0; i < length; i++) {
      token += chars[values[i] % chars.length];
    }
  } else {
    for (let i = 0; i < length; i++) {
      token += chars[Math.floor(Math.random() * chars.length)];
    }
  }
  return token;
}

// Initial demo share links for instant testing
const INITIAL_DEMO_LINKS: ShareLink[] = [
  {
    id: 'share_ticket_1',
    token: 'demo-ticket-8f92a4b8c1d3e5f7a9b0c2d4e6f8a1b3',
    targetType: 'ticket',
    targetId: 'ticket-1',
    createdBy: 'แอดมินวิภาดา (ผู้ดูแลโครงการ)',
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    isActive: true,
    allowImages: true,
    allowTimeline: true,
    allowQuotationApproval: true,
    maskLocation: true,
    viewCount: 3,
    lastViewedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'share_quotation_1',
    token: 'demo-quotation-7c81d2e3f4a5b6c7d8e9f0a1b2c3d4e5',
    targetType: 'quotation',
    targetId: 'quote-1',
    createdBy: 'แอดมินวิภาดา (ผู้ดูแลโครงการ)',
    expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    isActive: true,
    allowImages: true,
    allowTimeline: true,
    allowQuotationApproval: true,
    maskLocation: true,
    viewCount: 5,
    lastViewedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'share_acceptance_1',
    token: 'demo-acceptance-9e82b1c4a7f6d5e3c1b2a4f6e8d0c2b4',
    targetType: 'acceptance',
    targetId: 'ticket-5',
    createdBy: 'ช่างสมเกียรติ แก้วคำ (Technician)',
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    isActive: true,
    allowImages: true,
    allowTimeline: true,
    allowQuotationApproval: true,
    maskLocation: true,
    viewCount: 2,
    lastViewedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'share_expired_1',
    token: 'demo-expired-token-000000000000000000000000',
    targetType: 'ticket',
    targetId: 'ticket-1',
    createdBy: 'แอดมินวิภาดา (ผู้ดูแลโครงการ)',
    expiresAt: '2026-01-01T00:00:00.000Z',
    isActive: true,
    allowImages: true,
    allowTimeline: true,
    allowQuotationApproval: false,
    maskLocation: true,
    viewCount: 12,
    createdAt: '2025-12-01T08:00:00.000Z',
  },
  {
    id: 'share_deactivated_1',
    token: 'demo-deactivated-token-11111111111111111111',
    targetType: 'ticket',
    targetId: 'ticket-2',
    createdBy: 'แอดมินวิภาดา (ผู้ดูแลโครงการ)',
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    isActive: false,
    allowImages: true,
    allowTimeline: true,
    allowQuotationApproval: false,
    maskLocation: true,
    viewCount: 4,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export const ShareLinkService = {
  /**
   * Retrieve all links from storage
   */
  getShareLinks(): ShareLink[] {
    try {
      const stored = localStorage.getItem(SHARE_LINKS_KEY);
      if (!stored) {
        localStorage.setItem(SHARE_LINKS_KEY, JSON.stringify(INITIAL_DEMO_LINKS));
        return INITIAL_DEMO_LINKS;
      }
      return JSON.parse(stored) as ShareLink[];
    } catch {
      return INITIAL_DEMO_LINKS;
    }
  },

  /**
   * Save links to storage
   */
  saveShareLinks(links: ShareLink[]): void {
    localStorage.setItem(SHARE_LINKS_KEY, JSON.stringify(links));
  },

  /**
   * Create a new share link
   */
  createShareLink(options: {
    targetType: 'ticket' | 'quotation' | 'acceptance';
    targetId: string;
    createdBy: string;
    expiresInDays?: number | null; // 7, 30, 90, or null for no expiration
    allowImages?: boolean;
    allowTimeline?: boolean;
    allowQuotationApproval?: boolean;
    maskLocation?: boolean;
  }): ShareLink {
    const links = this.getShareLinks();
    const token = generateSecureToken(48);

    let expiresAt: string | undefined = undefined;
    if (options.expiresInDays && options.expiresInDays > 0) {
      const expDate = new Date();
      expDate.setDate(expDate.getDate() + options.expiresInDays);
      expiresAt = expDate.toISOString();
    }

    const newLink: ShareLink = {
      id: `link_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      token,
      targetType: options.targetType,
      targetId: options.targetId,
      createdBy: options.createdBy,
      expiresAt,
      isActive: true,
      allowImages: options.allowImages ?? true,
      allowTimeline: options.allowTimeline ?? true,
      allowQuotationApproval: options.allowQuotationApproval ?? true,
      maskLocation: options.maskLocation ?? true,
      viewCount: 0,
      createdAt: new Date().toISOString(),
    };

    links.unshift(newLink);
    this.saveShareLinks(links);
    return newLink;
  },

  /**
   * Validate token and register view count
   */
  getShareLinkByToken(
    token: string,
    registerView = true
  ): {
    isValid: boolean;
    reason?: 'not_found' | 'expired' | 'deactivated';
    shareLink?: ShareLink;
  } {
    const links = this.getShareLinks();
    const linkIndex = links.findIndex((l) => l.token === token);

    if (linkIndex === -1) {
      return { isValid: false, reason: 'not_found' };
    }

    const link = links[linkIndex];

    if (!link.isActive) {
      return { isValid: false, reason: 'deactivated', shareLink: link };
    }

    if (link.expiresAt) {
      const expTime = new Date(link.expiresAt).getTime();
      if (Date.now() > expTime) {
        return { isValid: false, reason: 'expired', shareLink: link };
      }
    }

    if (registerView) {
      link.viewCount = (link.viewCount || 0) + 1;
      link.lastViewedAt = new Date().toISOString();
      links[linkIndex] = link;
      this.saveShareLinks(links);
    }

    return { isValid: true, shareLink: link };
  },

  /**
   * Get active share link for specific target
   */
  getActiveShareLinkForTarget(
    targetType: 'ticket' | 'quotation' | 'acceptance',
    targetId: string
  ): ShareLink | null {
    const links = this.getShareLinks();
    const active = links.find(
      (l) =>
        l.targetType === targetType &&
        l.targetId === targetId &&
        l.isActive &&
        (!l.expiresAt || new Date(l.expiresAt).getTime() > Date.now())
    );
    return active || null;
  },

  /**
   * Get all share links for a target
   */
  getShareLinksForTarget(
    targetType: 'ticket' | 'quotation' | 'acceptance',
    targetId: string
  ): ShareLink[] {
    const links = this.getShareLinks();
    return links.filter(
      (l) => l.targetType === targetType && l.targetId === targetId
    );
  },

  /**
   * Toggle active state
   */
  toggleLinkActive(linkId: string): ShareLink | null {
    const links = this.getShareLinks();
    const index = links.findIndex((l) => l.id === linkId);
    if (index === -1) return null;

    links[index].isActive = !links[index].isActive;
    this.saveShareLinks(links);
    return links[index];
  },

  /**
   * Regenerate token for a link
   */
  regenerateToken(linkId: string): ShareLink | null {
    const links = this.getShareLinks();
    const index = links.findIndex((l) => l.id === linkId);
    if (index === -1) return null;

    links[index].token = generateSecureToken(48);
    links[index].isActive = true;
    links[index].viewCount = 0;
    links[index].lastViewedAt = undefined;
    this.saveShareLinks(links);
    return links[index];
  },

  /**
   * Update link settings
   */
  updateShareLink(linkId: string, updates: Partial<ShareLink>): ShareLink | null {
    const links = this.getShareLinks();
    const index = links.findIndex((l) => l.id === linkId);
    if (index === -1) return null;

    links[index] = { ...links[index], ...updates };
    this.saveShareLinks(links);
    return links[index];
  },

  /**
   * Delete link
   */
  deleteShareLink(linkId: string): boolean {
    const links = this.getShareLinks();
    const filtered = links.filter((l) => l.id !== linkId);
    this.saveShareLinks(filtered);
    return true;
  },

  /**
   * Format full URL for sharing
   */
  buildShareUrl(token: string, targetType: 'ticket' | 'quotation' | 'acceptance'): string {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
    const pathSlug = targetType === 'ticket' ? 'job' : targetType === 'quotation' ? 'quotation' : 'acceptance';
    return `${origin}${pathname}#/guest/${pathSlug}/${token}`;
  },

  /**
   * Mask room number / unit for privacy: e.g. "812" -> "***2", "ห้อง 1205" -> "ห้อง ***5"
   */
  maskLocation(unitNumber?: string, propertyName?: string, maskEnabled = true): string {
    if (!unitNumber) return propertyName || 'สถานที่ตามที่ระบุในระบบ';
    if (!maskEnabled) return `${propertyName ? `${propertyName} ` : ''}ห้อง ${unitNumber}`;

    const trimmed = unitNumber.trim();
    let maskedUnit = trimmed;
    if (trimmed.length > 2) {
      maskedUnit = '***' + trimmed.slice(-1);
    } else if (trimmed.length > 0) {
      maskedUnit = '***';
    }

    if (propertyName) {
      return `${propertyName} ห้อง ${maskedUnit}`;
    }
    return `ห้อง ${maskedUnit}`;
  },

  // -------------------------------------------------------------
  // GUEST APPROVALS LOGS
  // -------------------------------------------------------------
  getGuestApprovals(): GuestApproval[] {
    try {
      const stored = localStorage.getItem(GUEST_APPROVALS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  recordGuestApproval(approval: Omit<GuestApproval, 'id' | 'approvedAt'>): GuestApproval {
    const list = this.getGuestApprovals();
    const newApproval: GuestApproval = {
      ...approval,
      id: `appr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      approvedAt: new Date().toISOString(),
    };
    list.unshift(newApproval);
    localStorage.setItem(GUEST_APPROVALS_KEY, JSON.stringify(list));
    return newApproval;
  },

  getApprovalForQuotation(quotationId: string): GuestApproval | null {
    const list = this.getGuestApprovals();
    return list.find((a) => a.quotationId === quotationId) || null;
  },
};
