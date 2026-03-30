import mysql from 'mysql2/promise';

async function check() {
  const connection = await mysql.createConnection({
    socketPath: '/Applications/XAMPP/xamppfiles/var/mysql/mysql.sock',
    user: 'root',
    password: '',
    database: 'boost'
  });

  const [types] = await connection.execute('SELECT post_type, COUNT(*) as count FROM eTc6L_posts GROUP BY post_type');
  console.log('Post Types:', types);
  
  const [cct] = await connection.execute('SHOW TABLES LIKE "%cct%"');
  console.log('CCT Tables:', cct);

  await connection.end();
}
check();
