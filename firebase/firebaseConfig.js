const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccount.json');  // Path to your service account JSON file

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});
