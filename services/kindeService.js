const fetch = require('node-fetch');
const querystring = require('querystring');

/**
 * Service to handle Kinde API interactions
 */
class KindeService {
  constructor() {
    this.baseUrl = process.env.KINDE_ISSUER_URL;
    this.clientId = process.env.KINDE_CLIENT_ID;
    this.clientSecret = process.env.KINDE_CLIENT_SECRET;
    this.audience = process.env.KINDE_AUDIENCE;
  }

  /**
   * Get access token from Kinde
   * @returns {Promise<string>} Access token
   */
  async getAccessToken() {
    try {
      const tokenResponse = await fetch(`${this.baseUrl}/oauth2/token`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/x-www-form-urlencoded' 
        },
        body: querystring.stringify({
          grant_type: 'client_credentials',
          client_id: this.clientId,
          client_secret: this.clientSecret,
          audience: this.audience
        })
      });

      const tokenData = await tokenResponse.json();
      
      if (!tokenData.access_token) {
        throw new Error('Failed to get access token from Kinde');
      }
      
      return tokenData.access_token;
    } catch (error) {
      console.error('Error getting Kinde access token:', error);
      throw error;
    }
  }

  /**
   * Get or create organization in Kinde
   * @param {string} organizationName - Name of the organization
   * @param {string} accessToken - Kinde access token
   * @returns {Promise<string>} Organization code
   */
  async getOrCreateOrganization(organizationName, accessToken) {
    try {
      // Check if organization exists
      const getOrgsResponse = await fetch(
        `${this.baseUrl}/api/v1/organizations?name=${encodeURIComponent(organizationName)}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      const org = await getOrgsResponse.json();

      // If organization exists, return its code
      if (org.organizations && org.organizations.length > 0) {
        return org.organizations[0].code;
      }

      // Otherwise create a new organization
      const createOrgResponse = await fetch(`${this.baseUrl}/api/v1/organization`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: organizationName,
          features: {},
          is_sandbox: false
        })
      });

      const newOrg = await createOrgResponse.json();
      
      if (!newOrg.organization || !newOrg.organization.code) {
        throw new Error('Failed to create organization in Kinde');
      }
      
      return newOrg.organization.code;
    } catch (error) {
      console.error('Error with Kinde organization:', error);
      throw error;
    }
  }

  /**
   * Get or create role in Kinde
   * @param {string} roleName - Name of the role
   * @param {string} accessToken - Kinde access token
   * @returns {Promise<string>} Role ID
   */
  async getOrCreateRole(roleName, accessToken) {
    try {
      // Check if role exists
      const getRolesResponse = await fetch(
        `${this.baseUrl}/api/v1/roles?name=${encodeURIComponent(roleName)}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      const role = await getRolesResponse.json();

      // If role exists, return its ID
      if (role.roles && role.roles.length > 0) {
        return role.roles[0].id;
      }

      // Otherwise create a new role
      const roleKey = `${roleName.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
      const createRoleResponse = await fetch(`${this.baseUrl}/api/v1/roles`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: roleName,
          description: `Custom role for ${roleName}`,
          key: roleKey,
          is_default_role: false
        })
      });

      const newRole = await createRoleResponse.json();
      
      if (!newRole.role || !newRole.role.id) {
        throw new Error('Failed to create role in Kinde');
      }
      
      return newRole.role.id;
    } catch (error) {
      console.error('Error with Kinde role:', error);
      throw error;
    }
  }

  /**
   * Create user in Kinde
   * @param {Object} userData - User data
   * @param {string} orgCode - Organization code
   * @param {string} accessToken - Kinde access token
   * @returns {Promise<Object>} Created user
   */
  async createUser(userData, orgCode, accessToken) {
    try {
      const { firstName, lastName, email } = userData;

      const createUserResponse = await fetch(`${this.baseUrl}/api/v1/user`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          identities: [{
            type: 'email',
            details: {
              email
            }
          }],
          given_name: firstName,
          family_name: lastName,
          organization_code: orgCode
        })
      });

      const kindeUser = await createUserResponse.json();
      
      if (!kindeUser.id) {
        throw new Error('Failed to create user in Kinde');
      }
      
      return kindeUser;
    } catch (error) {
      console.error('Error creating Kinde user:', error);
      throw error;
    }
  }

  /**
   * Assign role to user in Kinde
   * @param {string} userId - Kinde user ID
   * @param {string} orgCode - Organization code
   * @param {string} roleId - Role ID
   * @param {string} accessToken - Kinde access token
   * @returns {Promise<void>}
   */
  async assignRoleToUser(userId, orgCode, roleId, accessToken) {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/organizations/${orgCode}/users/${userId}/roles`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            role_id: roleId
          })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to assign role: ${JSON.stringify(error)}`);
      }
      
      return true;
    } catch (error) {
      console.error('Error assigning role to user:', error);
      throw error;
    }
  }
}

module.exports = new KindeService();
console.log('KindeService initialized');