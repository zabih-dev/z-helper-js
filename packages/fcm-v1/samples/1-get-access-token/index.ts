import { getAccessToken } from '../../lib';

import * as keys from '../firebase-adminsdk.json';

(async () => {
  const access_token = await getAccessToken({
    client_email: keys.client_email,
    private_key: keys.private_key,
  });
  console.log('access_token:', access_token);
})();
