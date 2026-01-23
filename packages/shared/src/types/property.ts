import { Address, Timestamp } from './common';
import { PropertyStatus, PropertyType, UnitStatus } from '../constants/statuses';

/**
 * Property - a building or land parcel owned by an LLC
 */
export interface Property {
  id: string;
  llcId: string;
  name?: string;
  type: PropertyType;
  address: Address;
  status: PropertyStatus;
  purchaseDate?: Timestamp;
  purchasePrice?: number;
  notes?: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

/**
 * Unit - a rentable space within a property
 */
export interface Unit {
  id: string;
  llcId: string;
  propertyId: string;
  unitNumber: string;
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  status: UnitStatus;
  marketRent?: number;
  notes?: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}
