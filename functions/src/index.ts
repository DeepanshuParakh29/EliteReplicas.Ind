import * as functions from 'firebase-functions';
import serverApp from '../../server/index';

// Export the express app as an HTTPS function
export const api = functions.region('asia-south1').https.onRequest(serverApp);
