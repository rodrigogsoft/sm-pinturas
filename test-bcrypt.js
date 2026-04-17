const bcrypt = require('bcrypt');

const plainPassword = 'Admin@2026';
const hashedPassword = '\\\.L4fA8rZsCvxNfK4K6b5ObJ5p3x9L7eG';

console.log('Testing bcrypt comparison...');
console.log('Plain password:', plainPassword);
console.log('Hashed password:', hashedPassword);
console.log('');

bcrypt.compare(plainPassword, hashedPassword, (err, isMatch) => {
  if (err) {
    console.error('Error:', err);
    process.exit(1);
  }
  console.log('Password match:', isMatch);
  process.exit(isMatch ? 0 : 1);
});
