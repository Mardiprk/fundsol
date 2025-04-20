import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { wallet_address } = body;

    if (!wallet_address) {
      return NextResponse.json(
        { success: false, message: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db.execute({
      sql: 'SELECT id FROM users WHERE wallet_address = ?',
      args: [wallet_address]
    });

    const now = new Date().toISOString();

    if (existingUser.rows.length > 0) {
      // Update the user's last updated time
      await db.execute({
        sql: 'UPDATE users SET updated_at = ? WHERE wallet_address = ?',
        args: [now, wallet_address]
      });

      return NextResponse.json({
        success: true,
        message: 'User updated successfully',
        user: {
          id: existingUser.rows[0].id,
          wallet_address
        }
      });
    } else {
      // Create a new user
      const userId = uuidv4();

      await db.execute({
        sql: 'INSERT INTO users (id, wallet_address, created_at, updated_at) VALUES (?, ?, ?, ?)',
        args: [userId, wallet_address, now, now]
      });

      return NextResponse.json({
        success: true,
        message: 'User created successfully',
        user: {
          id: userId,
          wallet_address
        }
      }, { status: 201 });
    }
  } catch (error) {
    console.error('Error creating/updating user:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create/update user', error: String(error) },
      { status: 500 }
    );
  }
} 