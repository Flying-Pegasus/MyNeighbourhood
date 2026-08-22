import test from 'node:test';
import assert from 'node:assert/strict';
import User from '../models/User.js';
import { hashPassword } from '../utils/auth.js';

test('User model exposes credential auth helpers', () => {
    assert.equal(typeof User.findByCredentials, 'function');

    const hashed = hashPassword('secret123');
    const user = new User({
        name: 'Test User',
        email: 'test@example.com',
        password: hashed,
        role: 'Citizen'
    });

    assert.equal(typeof user.comparePassword, 'function');
    assert.notEqual(user.password, 'secret123');
    assert.equal(user.comparePassword('secret123'), true);
});
