import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

// Define a proper interface for user database row
interface UserRow {
  id: string;
  wallet_address: string;
  name: string | null;
  profile_completed: number;
  created_at: string;
  updated_at: string;
}

export async function POST(request: NextRequest) {
  try {
    const { walletAddress, name } = await request.json();
    
    if (!walletAddress) {
      return NextResponse.json(
        { success: false, message: 'Wallet address is required' },
        { status: 400 }
      );
    }
    
    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, message: 'Name is required' },
        { status: 400 }
      );
    }
    
    // Check if user already exists
    const userResult = await db.execute({
      sql: 'SELECT * FROM users WHERE wallet_address = ?',
      args: [walletAddress],
    });
    
    const now = new Date().toISOString();
    
    if (userResult.rows.length === 0) {
      // Create new user
      const userId = uuidv4();
      await db.execute({
        sql: `
          INSERT INTO users (id, wallet_address, name, profile_completed, created_at, updated_at)
          VALUES (?, ?, ?, 1, ?, ?)
        `,
        args: [userId, walletAddress, name, now, now],
      });
      
      return NextResponse.json({
        success: true,
        message: 'User profile created successfully',
        user: {
          id: userId,
          walletAddress,
          name,
          profileCompleted: true,
          createdAt: now,
          updatedAt: now,
        },
      });
    } else {  
      // Update existing user
      const user = userResult.rows[0] as unknown as UserRow;
      await db.execute({
        sql: `
          UPDATE users
          SET name = ?, profile_completed = 1, updated_at = ?
          WHERE wallet_address = ?
        `,
        args: [name, now, walletAddress],
      });
      
      return NextResponse.json({
        success: true,
        message: 'User profile updated successfully',
        user: {
          id: user.id,
          walletAddress,
          name,
          profileCompleted: user.profile_completed === 1,
          createdAt: user.created_at,
          updatedAt: now,
        },
      });
    }
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update user profile' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const walletAddress = request.nextUrl.searchParams.get('walletAddress');
    
    if (!walletAddress) {
      return NextResponse.json(
        { success: false, message: 'Wallet address is required' },
        { status: 400 }
      );
    }
    
    const userResult = await db.execute({
      sql: 'SELECT * FROM users WHERE wallet_address = ?',
      args: [walletAddress],
    });
    
    if (userResult.rows.length === 0) {
      return NextResponse.json({
        success: true,
        user: null,
      });
    }
    
    const user = userResult.rows[0] as unknown as UserRow;
    
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        walletAddress: user.wallet_address,
        name: user.name,
        profileCompleted: user.profile_completed === 1,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      },
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
} 