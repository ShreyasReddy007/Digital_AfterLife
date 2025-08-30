import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { Pool } from 'pg';
import bcrypt from 'bcrypt';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user?.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'POST') {
    try {
      const userId = session.user.id;
      const { recoveryKey } = req.body;

      if (!recoveryKey || typeof recoveryKey !== 'string' || recoveryKey.length < 10) {
        return res.status(400).json({ error: 'A valid recovery key is required.' });
      }

      //Verify that a key doesn't already exist before setting a new one.
      const { rows } = await pool.query(
        'SELECT "recoveryKeyHash" FROM users WHERE id = $1',
        [userId]
      );
      if (rows[0] && rows[0].recoveryKeyHash) {
        return res.status(409).json({ error: 'A recovery key already exists. Please delete the old one first.' });
      }

      const saltRounds = 10;
      const recoveryKeyHash = await bcrypt.hash(recoveryKey, saltRounds);

      await pool.query(
        'UPDATE users SET "recoveryKeyHash" = $1 WHERE id = $2',
        [recoveryKeyHash, userId]
      );

      res.status(200).json({ message: 'Recovery key set successfully.' });
    } catch (error) {
      console.error('Error setting recovery key:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
