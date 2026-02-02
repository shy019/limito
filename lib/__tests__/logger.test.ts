import { logger } from '../logger';

describe('logger', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('info', () => {
    it('should log info message', () => {
      logger.info('Test info message');
      expect(consoleLogSpy).toHaveBeenCalled();
      expect(consoleLogSpy.mock.calls[0][0]).toContain('ℹ️');
      expect(consoleLogSpy.mock.calls[0][0]).toContain('Test info message');
    });

    it('should log info message with data', () => {
      logger.info('Test info', { key: 'value' });
      expect(consoleLogSpy).toHaveBeenCalled();
      expect(consoleLogSpy.mock.calls[0][0]).toContain('{"key":"value"}');
    });
  });

  describe('warn', () => {
    it('should log warning message', () => {
      logger.warn('Test warning');
      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(consoleWarnSpy.mock.calls[0][0]).toContain('⚠️');
      expect(consoleWarnSpy.mock.calls[0][0]).toContain('Test warning');
    });
  });

  describe('error', () => {
    it('should log error message', () => {
      logger.error('Test error');
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(consoleErrorSpy.mock.calls[0][0]).toContain('❌');
      expect(consoleErrorSpy.mock.calls[0][0]).toContain('Test error');
    });
  });

  describe('success', () => {
    it('should log success message', () => {
      logger.success('Test success');
      expect(consoleLogSpy).toHaveBeenCalled();
      expect(consoleLogSpy.mock.calls[0][0]).toContain('✅');
      expect(consoleLogSpy.mock.calls[0][0]).toContain('Test success');
    });
  });
});
