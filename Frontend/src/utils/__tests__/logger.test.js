import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logger } from '../logger';

describe('logger util', () => {
  let logSpy, warnSpy, errorSpy, infoSpy, debugSpy, groupSpy, groupEndSpy, tableSpy;
  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    groupSpy = vi.spyOn(console, 'group').mockImplementation(() => {});
    groupEndSpy = vi.spyOn(console, 'groupEnd').mockImplementation(() => {});
    tableSpy = vi.spyOn(console, 'table').mockImplementation(() => {});
  });

  it('log/warn/info/debug llaman console en modo DEV', () => {
    logger.log('a');
    logger.warn('b');
    logger.info('c');
    logger.debug('d');
    expect(logSpy).toHaveBeenCalledWith('a');
    expect(warnSpy).toHaveBeenCalledWith('b');
    expect(infoSpy).toHaveBeenCalledWith('c');
    expect(debugSpy).toHaveBeenCalledWith('d');
  });

  it('error siempre se muestra', () => {
    logger.error('e');
    expect(errorSpy).toHaveBeenCalledWith('e');
  });

  it('group ejecuta callback y cierra grupo', () => {
    const fn = vi.fn();
    logger.group('grp', fn);
    expect(groupSpy).toHaveBeenCalledWith('grp');
    expect(fn).toHaveBeenCalled();
    expect(groupEndSpy).toHaveBeenCalled();
  });

  it('table muestra datos', () => {
    const data = [{ id: 1 }];
    logger.table(data);
    expect(tableSpy).toHaveBeenCalledWith(data);
  });
});