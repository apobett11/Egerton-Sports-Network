import { AdminCheckoutSettings, BusinessContactSettings, AdminProfile } from '../types';

export const DEFAULT_CHECKOUT_SETTINGS: AdminCheckoutSettings = {
  whatsappCheckoutEnabled: true,
  inAppCheckoutEnabled: true,
  teamKitMinQuantity: 1,
  depositRequired: false,
  depositType: 'percentage',
  depositValue: 0,
  requireOrderNotes: false,
  freeShippingThreshold: 10000,
  autoWhatsAppReceipt: true,
};

export const DEFAULT_BUSINESS_CONTACT: BusinessContactSettings = {
  businessEmail: '',
  callPhoneNumber: '',
  whatsappNumber: '',
  operatingHours: '',
  depotLocation: '',
};

export const DEFAULT_ADMIN_PROFILE: AdminProfile = {
  fullName: '',
  email: '',
  phone: '',
  role: 'Store Administrator',
  avatarUrl: '',
};

// LocalStorage Keys
const CHECKOUT_SETTINGS_KEY = 'egerscore_checkout_settings';
const BUSINESS_CONTACT_KEY = 'egerscore_business_contact';
const ADMIN_PROFILE_KEY = 'egerscore_admin_profile';

export const getStoredCheckoutSettings = (): AdminCheckoutSettings => {
  try {
    const raw = localStorage.getItem(CHECKOUT_SETTINGS_KEY);
    if (raw) return { ...DEFAULT_CHECKOUT_SETTINGS, ...JSON.parse(raw) };
  } catch (e) {
    console.error('Failed to parse checkout settings from storage', e);
  }
  return DEFAULT_CHECKOUT_SETTINGS;
};

export const saveStoredCheckoutSettings = (settings: AdminCheckoutSettings): void => {
  try {
    localStorage.setItem(CHECKOUT_SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save checkout settings', e);
  }
};

export const getStoredBusinessContact = (): BusinessContactSettings => {
  try {
    const raw = localStorage.getItem(BUSINESS_CONTACT_KEY);
    if (raw) return { ...DEFAULT_BUSINESS_CONTACT, ...JSON.parse(raw) };
  } catch (e) {
    console.error('Failed to parse business contact from storage', e);
  }
  return DEFAULT_BUSINESS_CONTACT;
};

export const saveStoredBusinessContact = (contact: BusinessContactSettings): void => {
  try {
    localStorage.setItem(BUSINESS_CONTACT_KEY, JSON.stringify(contact));
  } catch (e) {
    console.error('Failed to save business contact', e);
  }
};

export const getStoredAdminProfile = (): AdminProfile => {
  try {
    const raw = localStorage.getItem(ADMIN_PROFILE_KEY);
    if (raw) return { ...DEFAULT_ADMIN_PROFILE, ...JSON.parse(raw) };
  } catch (e) {
    console.error('Failed to parse admin profile from storage', e);
  }
  return DEFAULT_ADMIN_PROFILE;
};

export const saveStoredAdminProfile = (profile: AdminProfile): void => {
  try {
    localStorage.setItem(ADMIN_PROFILE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.error('Failed to save admin profile', e);
  }
};
