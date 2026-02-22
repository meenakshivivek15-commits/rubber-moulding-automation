import * as dotenv from 'dotenv';
import path from 'path';

// Load root .env file
dotenv.config({
    path: path.resolve(__dirname, '../../.env')
});

export const ENV = process.env.ENV || '';

export const PLANNER_URL = process.env.PLANNER_URL || '';
export const LEGACY_URL = process.env.LEGACY_URL || '';

export const PPA_USER = process.env.PPA_USER || '';
export const PPA_PASSWORD = process.env.PPA_PASSWORD || '';

export const ADMIN_USER = process.env.ADMIN_USER || '';
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';

export const ANDROID_DEVICE = process.env.ANDROID_DEVICE || '';
export const APP_PACKAGE = process.env.APP_PACKAGE || '';
export const APP_ACTIVITY = process.env.APP_ACTIVITY || '';
