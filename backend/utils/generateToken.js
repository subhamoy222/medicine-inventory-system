// import jwt from 'jsonwebtoken';

// const generateToken = (userId) => {
//   const secret = process.env.JWT_SECRET;
//   if (!secret) {
//     throw new Error('JWT_SECRET environment variable is not set');
//   }
//   return jwt.sign({ id: userId }, secret, { expiresIn: '1h' });
// };

// export default generateToken;

import jwt from 'jsonwebtoken';

const generateToken = (userId) => {
    // Ensure the environment variable JWT_SECRET is defined
    const secret = process.env.JWT_SECRET;
    
    if (!secret) {
        console.error('Error: JWT_SECRET environment variable is not set');
        throw new Error('JWT_SECRET environment variable is not set');
    }

    // Generate the JWT token
    return jwt.sign({ id: userId }, secret, { expiresIn: '1h' });
};

export default generateToken;

