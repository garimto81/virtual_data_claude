import { TournamentService } from '../../services/tournament.service';
import { Tournament, TournamentTable } from '../../types/database.types';

// Mock Supabase before importing any modules that use it
jest.mock('../../config/supabase');

describe('TournamentService Unit Tests', () => {
  let service: TournamentService;
  let mockFrom: jest.Mock;
  let mockInsert: jest.Mock;
  let mockSelect: jest.Mock;
  let mockEq: jest.Mock;
  let mockOrder: jest.Mock;
  let mockSingle: jest.Mock;

  beforeEach(() => {
    // Setup mocks
    mockSingle = jest.fn();
    mockOrder = jest.fn();
    mockEq = jest.fn();
    mockSelect = jest.fn();
    mockInsert = jest.fn();
    mockFrom = jest.fn();

    // Chain methods
    mockInsert.mockReturnThis();
    mockSelect.mockReturnThis();
    mockEq.mockReturnThis();
    mockOrder.mockReturnValue({ data: null, error: null });

    const chainObj = {
      insert: mockInsert,
      select: mockSelect,
      eq: mockEq,
      order: mockOrder,
      single: mockSingle,
    };

    mockInsert.mockReturnValue(chainObj);
    mockSelect.mockReturnValue(chainObj);
    mockEq.mockReturnValue(chainObj);
    mockFrom.mockReturnValue(chainObj);

    // Mock the supabase module
    const { supabase } = require('../../config/supabase');
    supabase.from = mockFrom;

    service = new TournamentService();
    jest.clearAllMocks();
  });

  describe('createTournament', () => {
    it('should create a tournament successfully', async () => {
      const mockTournament: Tournament = {
        id: '123',
        tournament_name: 'Test Tournament',
        start_date: '2024-01-01',
        end_date: '2024-01-02',
        venue: 'Test Venue',
        buy_in: 1000,
        starting_chips: 10000,
        status: 'upcoming',
      };

      mockSingle.mockResolvedValue({
        data: mockTournament,
        error: null,
      });

      const result = await service.createTournament({
        tournament_name: 'Test Tournament',
        start_date: '2024-01-01',
        end_date: '2024-01-02',
        venue: 'Test Venue',
        buy_in: 1000,
        starting_chips: 10000,
        status: 'upcoming',
      });

      expect(result).toEqual(mockTournament);
      expect(mockFrom).toHaveBeenCalledWith('tournaments');
    });

    it('should throw error when creation fails', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: new Error('Database error'),
      });

      await expect(
        service.createTournament({
          tournament_name: 'Test',
          start_date: '2024-01-01',
          end_date: '2024-01-02',
          venue: 'Test',
          buy_in: 1000,
          starting_chips: 10000,
          status: 'upcoming',
        })
      ).rejects.toThrow('Database error');
    });
  });

  describe('getTables', () => {
    it('should return tables for a tournament', async () => {
      const mockTables: TournamentTable[] = [
        {
          id: '1',
          tournament_id: '123',
          table_number: 1,
          table_name: 'Table 1',
          status: 'active',
          small_blind: 50,
          big_blind: 100,
          ante: 0,
          hands_played: 10,
        },
      ];

      mockOrder.mockResolvedValue({
        data: mockTables,
        error: null,
      });

      const result = await service.getTables('123');

      expect(result).toEqual(mockTables);
      expect(mockFrom).toHaveBeenCalledWith('tournament_tables');
    });

    it('should return empty array when no tables found', async () => {
      mockOrder.mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await service.getTables('123');

      expect(result).toEqual([]);
    });
  });
});