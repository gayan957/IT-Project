import jwt from 'jsonwebtoken';


export function generateToken(payload, secret, expiresIn) {
    return jwt.sign(payload, secret, { expiresIn });
}