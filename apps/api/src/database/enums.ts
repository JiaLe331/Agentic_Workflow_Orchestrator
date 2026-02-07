import { pgEnum } from 'drizzle-orm/pg-core';

export const genderEnum = pgEnum('gender', ['male', 'female', 'other']);
export const saleStatusEnum = pgEnum('sale_status', ['paid', 'unpaid', 'processing']);
