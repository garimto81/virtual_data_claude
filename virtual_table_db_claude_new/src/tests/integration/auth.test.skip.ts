import { AuthService } from '../../services/auth.service';
import { supabase } from '../../config/supabase';

describe.skip('Auth Integration Tests', () => {
  const authService = new AuthService();
  const testEmail = `test_${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';

  afterAll(async () => {
    // Clean up - delete test user if exists
    try {
      await supabase.auth.signOut();
    } catch (error) {
      // Ignore error if not signed in
    }
  });

  test('should sign up a new user', async () => {
    const result = await authService.signUp(testEmail, testPassword);
    
    expect(result).toBeDefined();
    expect(result.user).toBeDefined();
    expect(result.user?.email).toBe(testEmail);
  });

  test('should sign in with correct credentials', async () => {
    const result = await authService.signIn(testEmail, testPassword);
    
    expect(result).toBeDefined();
    expect(result.session).toBeDefined();
    expect(result.user?.email).toBe(testEmail);
  });

  test('should get current user', async () => {
    const user = await authService.getCurrentUser();
    
    expect(user).toBeDefined();
    expect(user?.email).toBe(testEmail);
  });

  test('should handle sign in with wrong password', async () => {
    await expect(
      authService.signIn(testEmail, 'WrongPassword')
    ).rejects.toThrow();
  });

  test('should sign out successfully', async () => {
    await expect(authService.signOut()).resolves.not.toThrow();
  });

  test('should handle getting current user when signed out', async () => {
    await expect(authService.getCurrentUser()).rejects.toThrow();
  });
});