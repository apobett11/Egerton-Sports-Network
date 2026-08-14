import { Player, Match, StandingEntry, TeamFormEntry, FormationName, PitchNodeCoordinate, TacticalSliders } from './types';

export const initialRoster: Player[] = [
    {
        id: 'p1',
        name: 'Marcus Thorne',
        number: 9,
        position: 'FW',
        rating: 84,
        cardImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
        status: 'Fit',
        goals: 14,
        speed: 88, shooting: 86, passing: 78, dribbling: 83, defense: 42, physical: 80, stamina: 82,
        formScore: 9.2
    },
    {
        id: 'p2',
        name: 'Leo Van Dijk',
        number: 6,
        position: 'MD',
        rating: 79,
        cardImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
        status: 'Fit',
        passPercent: 92.1,
        speed: 73, shooting: 68, passing: 89, dribbling: 81, defense: 74, physical: 72, stamina: 85,
        formScore: 8.5
    },
    {
        id: 'p3',
        name: 'Aaron Sterling',
        number: 1,
        position: 'GK',
        rating: 81,
        cardImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
        status: 'Recovering',
        saves: 42,
        speed: 55, shooting: 12, passing: 62, dribbling: 50, defense: 81, physical: 85, stamina: 65,
        formScore: 7.8
    },
    {
        id: 'p4',
        name: 'Soren Brandt',
        number: 4,
        position: 'DF',
        rating: 76,
        cardImage: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&auto=format&fit=crop&q=80',
        status: 'Fit',
        tackles: 68,
        speed: 74, shooting: 45, passing: 70, dribbling: 68, defense: 81, physical: 83, stamina: 80,
        formScore: 8.0
    },
    {
        id: 'p5',
        name: 'Emmanuel Haaland',
        number: 11,
        position: 'FW',
        rating: 91,
        cardImage: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80',
        status: 'Fit',
        goals: 25,
        speed: 89, shooting: 93, passing: 65, dribbling: 80, defense: 38, physical: 88, stamina: 78,
        formScore: 9.6
    },
    {
        id: 'p6',
        name: 'Kevin De Bruyne',
        number: 17,
        position: 'MD',
        rating: 90,
        cardImage: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop&q=80',
        status: 'Fit',
        passPercent: 94.3,
        speed: 76, shooting: 82, passing: 94, dribbling: 87, defense: 64, physical: 75, stamina: 85,
        formScore: 9.1
    },
    {
        id: 'p7',
        name: 'Rodrigo Cascante',
        number: 16,
        position: 'MD',
        rating: 89,
        cardImage: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80',
        status: 'Fit',
        passPercent: 91.5,
        speed: 72, shooting: 73, passing: 84, dribbling: 79, defense: 88, physical: 84, stamina: 90,
        formScore: 8.8
    },
    {
        id: 'p8',
        name: 'Ruben Dias',
        number: 5,
        position: 'DF',
        rating: 88,
        cardImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80',
        status: 'Fit',
        tackles: 74,
        speed: 73, shooting: 40, passing: 71, dribbling: 66, defense: 89, physical: 86, stamina: 82,
        formScore: 8.4
    },
    {
        id: 'p9',
        name: 'Phil Foden',
        number: 47,
        position: 'FW',
        rating: 86,
        cardImage: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400&auto=format&fit=crop&q=80',
        status: 'Fit',
        goals: 12,
        speed: 86, shooting: 82, passing: 85, dribbling: 89, defense: 56, physical: 64, stamina: 83,
        formScore: 8.7
    },
    {
        id: 'p10',
        name: 'Ederson Moraes',
        number: 31,
        position: 'GK',
        rating: 88,
        cardImage: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
        status: 'Fit',
        saves: 56,
        speed: 64, shooting: 20, passing: 82, dribbling: 68, defense: 88, physical: 82, stamina: 70,
        formScore: 8.9
    },
    {
        id: 'p11',
        name: 'Kyle Walker',
        number: 2,
        position: 'DF',
        rating: 84,
        cardImage: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=400&auto=format&fit=crop&q=80',
        status: 'Fit',
        tackles: 52,
        speed: 91, shooting: 62, passing: 76, dribbling: 77, defense: 80, physical: 82, stamina: 84,
        formScore: 8.2
    },
    {
        id: 'p12',
        name: 'Josko Gvardiol',
        number: 24,
        position: 'DF',
        rating: 83,
        cardImage: 'https://images.unsplash.com/photo-1528892952291-009c663ce843?w=400&auto=format&fit=crop&q=80',
        status: 'Fit',
        tackles: 48,
        speed: 78, shooting: 60, passing: 78, dribbling: 74, defense: 83, physical: 84, stamina: 82,
        formScore: 8.1
    },
    {
        id: 'p13',
        name: 'Bernardo Silva',
        number: 20,
        position: 'MD',
        rating: 88,
        cardImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
        status: 'Fit',
        goals: 9,
        speed: 77, shooting: 78, passing: 88, dribbling: 92, defense: 68, physical: 70, stamina: 92,
        formScore: 8.8
    },
    {
        id: 'p14',
        name: 'Jack Grealish',
        number: 10,
        position: 'FW',
        rating: 84,
        cardImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
        status: 'Fit',
        goals: 5,
        speed: 78, shooting: 76, passing: 84, dribbling: 88, defense: 46, physical: 74, stamina: 80,
        formScore: 7.9
    },
    {
        id: 'p15',
        name: 'Julian Alvarez',
        number: 19,
        position: 'FW',
        rating: 83,
        cardImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
        status: 'Fit',
        goals: 11,
        speed: 84, shooting: 84, passing: 79, dribbling: 82, defense: 54, physical: 76, stamina: 85,
        formScore: 8.3
    },
    {
        id: 'p16',
        name: 'Mateo Kovacic',
        number: 8,
        position: 'MD',
        rating: 82,
        cardImage: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&auto=format&fit=crop&q=80',
        status: 'Fit',
        passPercent: 89.2,
        speed: 74, shooting: 70, passing: 83, dribbling: 86, defense: 72, physical: 74, stamina: 80,
        formScore: 7.7
    },
    {
        id: 'p17',
        name: 'John Stones',
        number: 5,
        position: 'DF',
        rating: 85,
        cardImage: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80',
        status: 'Fit',
        tackles: 62,
        speed: 72, shooting: 52, passing: 82, dribbling: 78, defense: 86, physical: 80, stamina: 81,
        formScore: 8.4
    },
    {
        id: 'p18',
        name: 'Nathan Ake',
        number: 6,
        position: 'DF',
        rating: 82,
        cardImage: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop&q=80',
        status: 'Fit',
        tackles: 58,
        speed: 73, shooting: 40, passing: 72, dribbling: 68, defense: 83, physical: 80, stamina: 82,
        formScore: 8.0
    }
];

export const initialStandings: StandingEntry[] = [
    { position: 1, teamName: 'Man City', teamLogo: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=100&auto=format&fit=crop&q=80', played: 23, won: 16, drawn: 6, lost: 1, goalsFor: 52, goalsAgainst: 18, goalDifference: 34, points: 54, isCurrent: false, recentForm: ['W', 'W', 'W', 'D', 'W', 'W'] },
    { position: 2, teamName: 'Liverpool', teamLogo: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=100&auto=format&fit=crop&q=80', played: 23, won: 15, drawn: 7, lost: 1, goalsFor: 50, goalsAgainst: 20, goalDifference: 30, points: 52, isCurrent: false, recentForm: ['W', 'D', 'W', 'W', 'D', 'W'] },
    { position: 3, teamName: 'Arsenal', teamLogo: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=100&auto=format&fit=crop&q=80', played: 23, won: 15, drawn: 5, lost: 3, goalsFor: 44, goalsAgainst: 19, goalDifference: 25, points: 50, isCurrent: false, recentForm: ['W', 'L', 'W', 'W', 'D', 'W'] },
    { position: 4, teamName: 'Egerton FC', teamLogo: 'https://images.unsplash.com/photo-1517649763962-0c623266010b?w=100&auto=format&fit=crop&q=80', played: 23, won: 14, drawn: 6, lost: 3, goalsFor: 42, goalsAgainst: 22, goalDifference: 20, points: 48, isCurrent: true, recentForm: ['W', 'W', 'D', 'W', 'L', 'W'] },
    { position: 5, teamName: 'Tottenham', teamLogo: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=100&auto=format&fit=crop&q=80', played: 23, won: 13, drawn: 5, lost: 5, goalsFor: 41, goalsAgainst: 24, goalDifference: 17, points: 44, isCurrent: false, recentForm: ['D', 'W', 'L', 'W', 'D', 'L'] },
    { position: 6, teamName: 'Chelsea', teamLogo: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=100&auto=format&fit=crop&q=80', played: 23, won: 11, drawn: 6, lost: 6, goalsFor: 38, goalsAgainst: 28, goalDifference: 10, points: 39, isCurrent: false, recentForm: ['L', 'W', 'D', 'L', 'W', 'D'] },
    { position: 7, teamName: 'Newcastle', teamLogo: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=100&auto=format&fit=crop&q=80', played: 23, won: 10, drawn: 5, lost: 8, goalsFor: 35, goalsAgainst: 31, goalDifference: 4, points: 35, isCurrent: false, recentForm: ['W', 'L', 'L', 'D', 'W', 'L'] }
];

export const initialTeamForm: TeamFormEntry[] = [
    {
        matchId: 'form-1',
        opponentName: 'Engineering XI',
        opponentLogo: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=100&auto=format&fit=crop&q=80',
        result: 'W',
        scoreText: '3 - 1',
        date: 'Aug 10',
        competition: 'Premier League',
        goalDifference: 2,
    },
    {
        matchId: 'form-2',
        opponentName: 'Tatton FC',
        opponentLogo: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=100&auto=format&fit=crop&q=80',
        result: 'W',
        scoreText: '2 - 0',
        date: 'Aug 03',
        competition: 'Premier League',
        goalDifference: 2,
    },
    {
        matchId: 'form-3',
        opponentName: 'Maragoli Strikers',
        opponentLogo: 'https://images.unsplash.com/photo-1517649763962-0c623266010b?w=100&auto=format&fit=crop&q=80',
        result: 'D',
        scoreText: '1 - 1',
        date: 'Jul 27',
        competition: 'Premier League',
        goalDifference: 0,
    },
    {
        matchId: 'form-4',
        opponentName: 'Njoro City FC',
        opponentLogo: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=100&auto=format&fit=crop&q=80',
        result: 'W',
        scoreText: '4 - 2',
        date: 'Jul 20',
        competition: 'Inter-Faculty Cup',
        goalDifference: 2,
    },
    {
        matchId: 'form-5',
        opponentName: 'Medical Stars',
        opponentLogo: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=100&auto=format&fit=crop&q=80',
        result: 'L',
        scoreText: '0 - 1',
        date: 'Jul 14',
        competition: 'Premier League',
        goalDifference: -1,
    },
    {
        matchId: 'form-6',
        opponentName: 'Agriculture FC',
        opponentLogo: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=100&auto=format&fit=crop&q=80',
        result: 'W',
        scoreText: '2 - 1',
        date: 'Jul 07',
        competition: 'Premier League',
        goalDifference: 1,
    },
];

export const initialFixtures: Match[] = [
    {
        id: 'f1',
        opponentName: 'Engineering XI',
        opponentLogo: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=100&auto=format&fit=crop&q=80',
        date: 'Saturday, Aug 16',
        time: '16:00',
        location: 'Pavilion Main Stadium',
        league: 'Egerton Premier League',
        status: 'UPCOMING'
    },
    {
        id: 'f2',
        opponentName: 'Agriculture FC',
        opponentLogo: 'https://images.unsplash.com/photo-1517649763962-0c623266010b?w=100&auto=format&fit=crop&q=80',
        date: 'Saturday, Aug 23',
        time: '14:30',
        location: 'Kilimo Grounds',
        league: 'Egerton Premier League',
        status: 'UPCOMING'
    },
    {
        id: 'f3',
        opponentName: 'Maragoli Strikers',
        opponentLogo: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=100&auto=format&fit=crop&q=80',
        date: 'Tuesday, Aug 26',
        time: '18:00',
        location: 'Pavilion Turf B',
        league: 'Campus Championship',
        status: 'UPCOMING'
    },
    {
        id: 'f_past_1',
        opponentName: 'Tatton FC',
        opponentLogo: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=100&auto=format&fit=crop&q=80',
        date: 'Sunday, Aug 10',
        time: '16:00',
        location: 'Pavilion Main Stadium',
        league: 'Egerton Premier League',
        status: 'FINISHED',
        score: '3 - 1',
        result: 'W'
    },
    {
        id: 'f_past_2',
        opponentName: 'Njoro City FC',
        opponentLogo: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=100&auto=format&fit=crop&q=80',
        date: 'Saturday, Aug 03',
        time: '15:00',
        location: 'Njoro Turf',
        league: 'Egerton Premier League',
        status: 'FINISHED',
        score: '2 - 0',
        result: 'W'
    }
];

// Complete 11 tactical formations with baseline coordinates from bottom (goal line) & right (sideline)
export const FORMATION_CONFIGS: Record<FormationName, PitchNodeCoordinate[]> = {
    '4-3-3 Attack': [
        { roleLabel: 'GK', baseBottom: 10, baseRight: 50, positionType: 'GK', bottomPercent: 10, rightPercent: 50 },
        { roleLabel: 'LB', baseBottom: 28, baseRight: 84, positionType: 'DF', isWide: true, bottomPercent: 28, rightPercent: 84 },
        { roleLabel: 'CB', baseBottom: 24, baseRight: 64, positionType: 'DF', bottomPercent: 24, rightPercent: 64 },
        { roleLabel: 'CB', baseBottom: 24, baseRight: 36, positionType: 'DF', bottomPercent: 24, rightPercent: 36 },
        { roleLabel: 'RB', baseBottom: 28, baseRight: 16, positionType: 'DF', isWide: true, bottomPercent: 28, rightPercent: 16 },
        { roleLabel: 'DM', baseBottom: 44, baseRight: 50, positionType: 'MD', bottomPercent: 44, rightPercent: 50 },
        { roleLabel: 'LCM', baseBottom: 58, baseRight: 68, positionType: 'MD', bottomPercent: 58, rightPercent: 68 },
        { roleLabel: 'RCM', baseBottom: 58, baseRight: 32, positionType: 'MD', bottomPercent: 58, rightPercent: 32 },
        { roleLabel: 'LW', baseBottom: 78, baseRight: 82, positionType: 'FW', isWide: true, bottomPercent: 78, rightPercent: 82 },
        { roleLabel: 'RW', baseBottom: 78, baseRight: 18, positionType: 'FW', isWide: true, bottomPercent: 78, rightPercent: 18 },
        { roleLabel: 'ST', baseBottom: 88, baseRight: 50, positionType: 'FW', bottomPercent: 88, rightPercent: 50 }
    ],
    '4-3-3 Defend': [
        { roleLabel: 'GK', baseBottom: 10, baseRight: 50, positionType: 'GK', bottomPercent: 10, rightPercent: 50 },
        { roleLabel: 'LB', baseBottom: 24, baseRight: 84, positionType: 'DF', isWide: true, bottomPercent: 24, rightPercent: 84 },
        { roleLabel: 'CB', baseBottom: 20, baseRight: 64, positionType: 'DF', bottomPercent: 20, rightPercent: 64 },
        { roleLabel: 'CB', baseBottom: 20, baseRight: 36, positionType: 'DF', bottomPercent: 20, rightPercent: 36 },
        { roleLabel: 'RB', baseBottom: 24, baseRight: 16, positionType: 'DF', isWide: true, bottomPercent: 24, rightPercent: 16 },
        { roleLabel: 'LDM', baseBottom: 38, baseRight: 62, positionType: 'MD', bottomPercent: 38, rightPercent: 62 },
        { roleLabel: 'RDM', baseBottom: 38, baseRight: 38, positionType: 'MD', bottomPercent: 38, rightPercent: 38 },
        { roleLabel: 'CAM', baseBottom: 60, baseRight: 50, positionType: 'MD', bottomPercent: 60, rightPercent: 50 },
        { roleLabel: 'LW', baseBottom: 72, baseRight: 80, positionType: 'FW', isWide: true, bottomPercent: 72, rightPercent: 80 },
        { roleLabel: 'RW', baseBottom: 72, baseRight: 20, positionType: 'FW', isWide: true, bottomPercent: 72, rightPercent: 20 },
        { roleLabel: 'ST', baseBottom: 86, baseRight: 50, positionType: 'FW', bottomPercent: 86, rightPercent: 50 }
    ],
    '4-4-2 Flat': [
        { roleLabel: 'GK', baseBottom: 10, baseRight: 50, positionType: 'GK', bottomPercent: 10, rightPercent: 50 },
        { roleLabel: 'LB', baseBottom: 26, baseRight: 84, positionType: 'DF', isWide: true, bottomPercent: 26, rightPercent: 84 },
        { roleLabel: 'CB', baseBottom: 22, baseRight: 64, positionType: 'DF', bottomPercent: 22, rightPercent: 64 },
        { roleLabel: 'CB', baseBottom: 22, baseRight: 36, positionType: 'DF', bottomPercent: 22, rightPercent: 36 },
        { roleLabel: 'RB', baseBottom: 26, baseRight: 16, positionType: 'DF', isWide: true, bottomPercent: 26, rightPercent: 16 },
        { roleLabel: 'LM', baseBottom: 54, baseRight: 84, positionType: 'MD', isWide: true, bottomPercent: 54, rightPercent: 84 },
        { roleLabel: 'LCM', baseBottom: 50, baseRight: 62, positionType: 'MD', bottomPercent: 50, rightPercent: 62 },
        { roleLabel: 'RCM', baseBottom: 50, baseRight: 38, positionType: 'MD', bottomPercent: 50, rightPercent: 38 },
        { roleLabel: 'RM', baseBottom: 54, baseRight: 16, positionType: 'MD', isWide: true, bottomPercent: 54, rightPercent: 16 },
        { roleLabel: 'LS', baseBottom: 84, baseRight: 64, positionType: 'FW', bottomPercent: 84, rightPercent: 64 },
        { roleLabel: 'RS', baseBottom: 84, baseRight: 36, positionType: 'FW', bottomPercent: 84, rightPercent: 36 }
    ],
    '4-4-2 Diamond': [
        { roleLabel: 'GK', baseBottom: 10, baseRight: 50, positionType: 'GK', bottomPercent: 10, rightPercent: 50 },
        { roleLabel: 'LB', baseBottom: 26, baseRight: 84, positionType: 'DF', isWide: true, bottomPercent: 26, rightPercent: 84 },
        { roleLabel: 'CB', baseBottom: 22, baseRight: 64, positionType: 'DF', bottomPercent: 22, rightPercent: 64 },
        { roleLabel: 'CB', baseBottom: 22, baseRight: 36, positionType: 'DF', bottomPercent: 22, rightPercent: 36 },
        { roleLabel: 'RB', baseBottom: 26, baseRight: 16, positionType: 'DF', isWide: true, bottomPercent: 26, rightPercent: 16 },
        { roleLabel: 'CDM', baseBottom: 42, baseRight: 50, positionType: 'MD', bottomPercent: 42, rightPercent: 50 },
        { roleLabel: 'LM', baseBottom: 56, baseRight: 78, positionType: 'MD', isWide: true, bottomPercent: 56, rightPercent: 78 },
        { roleLabel: 'RM', baseBottom: 56, baseRight: 22, positionType: 'MD', isWide: true, bottomPercent: 56, rightPercent: 22 },
        { roleLabel: 'CAM', baseBottom: 68, baseRight: 50, positionType: 'MD', bottomPercent: 68, rightPercent: 50 },
        { roleLabel: 'LS', baseBottom: 86, baseRight: 64, positionType: 'FW', bottomPercent: 86, rightPercent: 64 },
        { roleLabel: 'RS', baseBottom: 86, baseRight: 36, positionType: 'FW', bottomPercent: 86, rightPercent: 36 }
    ],
    '4-2-3-1 Wide': [
        { roleLabel: 'GK', baseBottom: 10, baseRight: 50, positionType: 'GK', bottomPercent: 10, rightPercent: 50 },
        { roleLabel: 'LB', baseBottom: 26, baseRight: 84, positionType: 'DF', isWide: true, bottomPercent: 26, rightPercent: 84 },
        { roleLabel: 'CB', baseBottom: 22, baseRight: 64, positionType: 'DF', bottomPercent: 22, rightPercent: 64 },
        { roleLabel: 'CB', baseBottom: 22, baseRight: 36, positionType: 'DF', bottomPercent: 22, rightPercent: 36 },
        { roleLabel: 'RB', baseBottom: 26, baseRight: 16, positionType: 'DF', isWide: true, bottomPercent: 26, rightPercent: 16 },
        { roleLabel: 'LDM', baseBottom: 44, baseRight: 62, positionType: 'MD', bottomPercent: 44, rightPercent: 62 },
        { roleLabel: 'RDM', baseBottom: 44, baseRight: 38, positionType: 'MD', bottomPercent: 44, rightPercent: 38 },
        { roleLabel: 'LAM', baseBottom: 68, baseRight: 80, positionType: 'MD', isWide: true, bottomPercent: 68, rightPercent: 80 },
        { roleLabel: 'CAM', baseBottom: 66, baseRight: 50, positionType: 'MD', bottomPercent: 66, rightPercent: 50 },
        { roleLabel: 'RAM', baseBottom: 68, baseRight: 20, positionType: 'MD', isWide: true, bottomPercent: 68, rightPercent: 20 },
        { roleLabel: 'ST', baseBottom: 88, baseRight: 50, positionType: 'FW', bottomPercent: 88, rightPercent: 50 }
    ],
    '4-1-4-1': [
        { roleLabel: 'GK', baseBottom: 10, baseRight: 50, positionType: 'GK', bottomPercent: 10, rightPercent: 50 },
        { roleLabel: 'LB', baseBottom: 26, baseRight: 84, positionType: 'DF', isWide: true, bottomPercent: 26, rightPercent: 84 },
        { roleLabel: 'CB', baseBottom: 22, baseRight: 64, positionType: 'DF', bottomPercent: 22, rightPercent: 64 },
        { roleLabel: 'CB', baseBottom: 22, baseRight: 36, positionType: 'DF', bottomPercent: 22, rightPercent: 36 },
        { roleLabel: 'RB', baseBottom: 26, baseRight: 16, positionType: 'DF', isWide: true, bottomPercent: 26, rightPercent: 16 },
        { roleLabel: 'CDM', baseBottom: 42, baseRight: 50, positionType: 'MD', bottomPercent: 42, rightPercent: 50 },
        { roleLabel: 'LM', baseBottom: 62, baseRight: 82, positionType: 'MD', isWide: true, bottomPercent: 62, rightPercent: 82 },
        { roleLabel: 'LCM', baseBottom: 60, baseRight: 62, positionType: 'MD', bottomPercent: 60, rightPercent: 62 },
        { roleLabel: 'RCM', baseBottom: 60, baseRight: 38, positionType: 'MD', bottomPercent: 60, rightPercent: 38 },
        { roleLabel: 'RM', baseBottom: 62, baseRight: 18, positionType: 'MD', isWide: true, bottomPercent: 62, rightPercent: 18 },
        { roleLabel: 'ST', baseBottom: 88, baseRight: 50, positionType: 'FW', bottomPercent: 88, rightPercent: 50 }
    ],
    '3-5-2': [
        { roleLabel: 'GK', baseBottom: 10, baseRight: 50, positionType: 'GK', bottomPercent: 10, rightPercent: 50 },
        { roleLabel: 'LCB', baseBottom: 24, baseRight: 74, positionType: 'DF', bottomPercent: 24, rightPercent: 74 },
        { roleLabel: 'CB', baseBottom: 20, baseRight: 50, positionType: 'DF', bottomPercent: 20, rightPercent: 50 },
        { roleLabel: 'RCB', baseBottom: 24, baseRight: 26, positionType: 'DF', bottomPercent: 24, rightPercent: 26 },
        { roleLabel: 'LWB', baseBottom: 48, baseRight: 88, positionType: 'MD', isWide: true, bottomPercent: 48, rightPercent: 88 },
        { roleLabel: 'LDM', baseBottom: 44, baseRight: 62, positionType: 'MD', bottomPercent: 44, rightPercent: 62 },
        { roleLabel: 'RDM', baseBottom: 44, baseRight: 38, positionType: 'MD', bottomPercent: 44, rightPercent: 38 },
        { roleLabel: 'RWB', baseBottom: 48, baseRight: 12, positionType: 'MD', isWide: true, bottomPercent: 48, rightPercent: 12 },
        { roleLabel: 'CAM', baseBottom: 66, baseRight: 50, positionType: 'MD', bottomPercent: 66, rightPercent: 50 },
        { roleLabel: 'LS', baseBottom: 86, baseRight: 64, positionType: 'FW', bottomPercent: 86, rightPercent: 64 },
        { roleLabel: 'RS', baseBottom: 86, baseRight: 36, positionType: 'FW', bottomPercent: 86, rightPercent: 36 }
    ],
    '3-4-3': [
        { roleLabel: 'GK', baseBottom: 10, baseRight: 50, positionType: 'GK', bottomPercent: 10, rightPercent: 50 },
        { roleLabel: 'LCB', baseBottom: 24, baseRight: 74, positionType: 'DF', bottomPercent: 24, rightPercent: 74 },
        { roleLabel: 'CB', baseBottom: 20, baseRight: 50, positionType: 'DF', bottomPercent: 20, rightPercent: 50 },
        { roleLabel: 'RCB', baseBottom: 24, baseRight: 26, positionType: 'DF', bottomPercent: 24, rightPercent: 26 },
        { roleLabel: 'LM', baseBottom: 52, baseRight: 86, positionType: 'MD', isWide: true, bottomPercent: 52, rightPercent: 86 },
        { roleLabel: 'LCM', baseBottom: 50, baseRight: 62, positionType: 'MD', bottomPercent: 50, rightPercent: 62 },
        { roleLabel: 'RCM', baseBottom: 50, baseRight: 38, positionType: 'MD', bottomPercent: 50, rightPercent: 38 },
        { roleLabel: 'RM', baseBottom: 52, baseRight: 14, positionType: 'MD', isWide: true, bottomPercent: 52, rightPercent: 14 },
        { roleLabel: 'LW', baseBottom: 80, baseRight: 80, positionType: 'FW', isWide: true, bottomPercent: 80, rightPercent: 80 },
        { roleLabel: 'ST', baseBottom: 88, baseRight: 50, positionType: 'FW', bottomPercent: 88, rightPercent: 50 },
        { roleLabel: 'RW', baseBottom: 80, baseRight: 20, positionType: 'FW', isWide: true, bottomPercent: 80, rightPercent: 20 }
    ],
    '5-3-2': [
        { roleLabel: 'GK', baseBottom: 10, baseRight: 50, positionType: 'GK', bottomPercent: 10, rightPercent: 50 },
        { roleLabel: 'LWB', baseBottom: 32, baseRight: 88, positionType: 'DF', isWide: true, bottomPercent: 32, rightPercent: 88 },
        { roleLabel: 'LCB', baseBottom: 22, baseRight: 70, positionType: 'DF', bottomPercent: 22, rightPercent: 70 },
        { roleLabel: 'CB', baseBottom: 18, baseRight: 50, positionType: 'DF', bottomPercent: 18, rightPercent: 50 },
        { roleLabel: 'RCB', baseBottom: 22, baseRight: 30, positionType: 'DF', bottomPercent: 22, rightPercent: 30 },
        { roleLabel: 'RWB', baseBottom: 32, baseRight: 12, positionType: 'DF', isWide: true, bottomPercent: 32, rightPercent: 12 },
        { roleLabel: 'LCM', baseBottom: 52, baseRight: 68, positionType: 'MD', bottomPercent: 52, rightPercent: 68 },
        { roleLabel: 'CM', baseBottom: 48, baseRight: 50, positionType: 'MD', bottomPercent: 48, rightPercent: 50 },
        { roleLabel: 'RCM', baseBottom: 52, baseRight: 32, positionType: 'MD', bottomPercent: 52, rightPercent: 32 },
        { roleLabel: 'LS', baseBottom: 84, baseRight: 64, positionType: 'FW', bottomPercent: 84, rightPercent: 64 },
        { roleLabel: 'RS', baseBottom: 84, baseRight: 36, positionType: 'FW', bottomPercent: 84, rightPercent: 36 }
    ],
    '5-4-1': [
        { roleLabel: 'GK', baseBottom: 10, baseRight: 50, positionType: 'GK', bottomPercent: 10, rightPercent: 50 },
        { roleLabel: 'LWB', baseBottom: 30, baseRight: 88, positionType: 'DF', isWide: true, bottomPercent: 30, rightPercent: 88 },
        { roleLabel: 'LCB', baseBottom: 20, baseRight: 70, positionType: 'DF', bottomPercent: 20, rightPercent: 70 },
        { roleLabel: 'CB', baseBottom: 17, baseRight: 50, positionType: 'DF', bottomPercent: 17, rightPercent: 50 },
        { roleLabel: 'RCB', baseBottom: 20, baseRight: 30, positionType: 'DF', bottomPercent: 20, rightPercent: 30 },
        { roleLabel: 'RWB', baseBottom: 30, baseRight: 12, positionType: 'DF', isWide: true, bottomPercent: 30, rightPercent: 12 },
        { roleLabel: 'LM', baseBottom: 52, baseRight: 84, positionType: 'MD', isWide: true, bottomPercent: 52, rightPercent: 84 },
        { roleLabel: 'LCM', baseBottom: 48, baseRight: 62, positionType: 'MD', bottomPercent: 48, rightPercent: 62 },
        { roleLabel: 'RCM', baseBottom: 48, baseRight: 38, positionType: 'MD', bottomPercent: 48, rightPercent: 38 },
        { roleLabel: 'RM', baseBottom: 52, baseRight: 16, positionType: 'MD', isWide: true, bottomPercent: 52, rightPercent: 16 },
        { roleLabel: 'ST', baseBottom: 86, baseRight: 50, positionType: 'FW', bottomPercent: 86, rightPercent: 50 }
    ],
    '4-4-1-1': [
        { roleLabel: 'GK', baseBottom: 10, baseRight: 50, positionType: 'GK', bottomPercent: 10, rightPercent: 50 },
        { roleLabel: 'LB', baseBottom: 26, baseRight: 84, positionType: 'DF', isWide: true, bottomPercent: 26, rightPercent: 84 },
        { roleLabel: 'CB', baseBottom: 22, baseRight: 64, positionType: 'DF', bottomPercent: 22, rightPercent: 64 },
        { roleLabel: 'CB', baseBottom: 22, baseRight: 36, positionType: 'DF', bottomPercent: 22, rightPercent: 36 },
        { roleLabel: 'RB', baseBottom: 26, baseRight: 16, positionType: 'DF', isWide: true, bottomPercent: 26, rightPercent: 16 },
        { roleLabel: 'LM', baseBottom: 54, baseRight: 84, positionType: 'MD', isWide: true, bottomPercent: 54, rightPercent: 84 },
        { roleLabel: 'LCM', baseBottom: 50, baseRight: 62, positionType: 'MD', bottomPercent: 50, rightPercent: 62 },
        { roleLabel: 'RCM', baseBottom: 50, baseRight: 38, positionType: 'MD', bottomPercent: 50, rightPercent: 38 },
        { roleLabel: 'RM', baseBottom: 54, baseRight: 16, positionType: 'MD', isWide: true, bottomPercent: 54, rightPercent: 16 },
        { roleLabel: 'CF', baseBottom: 72, baseRight: 50, positionType: 'FW', bottomPercent: 72, rightPercent: 50 },
        { roleLabel: 'ST', baseBottom: 88, baseRight: 50, positionType: 'FW', bottomPercent: 88, rightPercent: 50 }
    ]
};

/**
 * Tactical Physics Coordinate Calculation Engine
 * Dynamically computes adjusted bottom and right percentages based on:
 * - Attacking Depth (pushed forward)
 * - Defensive Line Height (pushed up)
 * - Team Support Width (spread out wide)
 * - Pressing Intensity (compact compression)
 */
export function calculateDynamicPitchCoordinates(
    formation: FormationName,
    sliders: TacticalSliders,
    overrides?: { bottomPercent: number; rightPercent: number }[]
): PitchNodeCoordinate[] {
    const baseNodes = FORMATION_CONFIGS[formation] || FORMATION_CONFIGS['4-3-3 Attack'];

    const depthShift = ((sliders.attackingDepth - 50) / 50) * 8; // -8% to +8%
    const defLineShift = ((sliders.defensiveLineHeight - 50) / 50) * 10; // -10% to +10%
    const widthFactor = (sliders.teamSupportWidth - 50) / 50; // -1 to +1
    const pressCompression = ((sliders.pressingIntensity - 50) / 50) * 6; // -6% to +6%

    return baseNodes.map((node, idx) => {
        if (overrides && overrides[idx]) {
            return {
                ...node,
                bottomPercent: overrides[idx].bottomPercent,
                rightPercent: overrides[idx].rightPercent
            };
        }

        let dynamicBottom = node.baseBottom;
        let dynamicRight = node.baseRight;

        // Apply Defensive Line Shift
        if (node.positionType === 'DF') {
            dynamicBottom += defLineShift;
        } else if (node.positionType === 'MD') {
            dynamicBottom += (defLineShift * 0.5) + (depthShift * 0.5);
        } else if (node.positionType === 'FW') {
            dynamicBottom += depthShift;
        }

        // Apply Pressing Compression (pulls midfielders and forwards closer to active defense line)
        if (node.positionType === 'MD') {
            dynamicBottom -= pressCompression * 0.3;
        } else if (node.positionType === 'FW') {
            dynamicBottom -= pressCompression * 0.5;
        }

        // Apply Team Support Width (Out Wide Expansion)
        const isLeftSide = node.baseRight > 50;
        const isRightSide = node.baseRight < 50;

        if (node.isWide) {
            // Wide wingers / fullbacks expand significantly towards the touchlines
            if (isLeftSide) {
                dynamicRight = Math.min(94, node.baseRight + (widthFactor * 10));
            } else if (isRightSide) {
                dynamicRight = Math.max(6, node.baseRight - (widthFactor * 10));
            }
        } else if (isLeftSide) {
            dynamicRight = Math.min(80, node.baseRight + (widthFactor * 4));
        } else if (isRightSide) {
            dynamicRight = Math.max(20, node.baseRight - (widthFactor * 4));
        }

        // Clamp inside pitch bounds
        dynamicBottom = Math.max(6, Math.min(94, Math.round(dynamicBottom * 10) / 10));
        dynamicRight = Math.max(6, Math.min(94, Math.round(dynamicRight * 10) / 10));

        return {
            ...node,
            bottomPercent: dynamicBottom,
            rightPercent: dynamicRight
        };
    });
}

export const initialPracticeSchedule = [
    {
        id: 'ps1',
        day: 'Monday',
        time: '09:00 - 11:30',
        location: 'Pavilion Main Stadium',
        activity: 'Gas drills & Footwork',
        assignedBy: 'Captain Leo'
    },
    {
        id: 'ps2',
        day: 'Wednesday',
        time: '10:00 - 12:30',
        location: 'Pavilion Turf B',
        activity: 'Football control & Passing',
        assignedBy: 'Captain Leo'
    },
    {
        id: 'ps3',
        day: 'Friday',
        time: '15:00 - 17:00',
        location: 'Kilimo Grounds',
        activity: 'Pitch positioning & Tactical drills',
        assignedBy: 'Captain Leo'
    }
];

export const initialKits = [
    {
        id: 'home',
        name: 'Egerton Gold Home Kit',
        description: 'Elite royal gold with high-contrast obsidian stripes and crest embroidery',
        primaryBg: '#D4AF37',
        stripeColor: '#0F172A',
        accentColor: '#FFFFFF',
        collarColor: '#0F172A',
        imageUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=400&auto=format&fit=crop&q=80'
    },
    {
        id: 'away',
        name: 'Obsidian Trim Away Kit',
        description: 'Crisp arctic white with obsidian chevron pattern and golden collar accent',
        primaryBg: '#FFFFFF',
        stripeColor: '#0F172A',
        accentColor: '#D4AF37',
        collarColor: '#D4AF37',
        imageUrl: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=400&auto=format&fit=crop&q=80'
    },
    {
        id: 'third',
        name: 'Midnight Neon Third Kit',
        description: 'Stealth matte black with electric neon emerald trim for night derbies',
        primaryBg: '#0F172A',
        stripeColor: null,
        accentColor: '#10B981',
        collarColor: '#10B981',
        imageUrl: 'https://images.unsplash.com/photo-1517649763962-0c623266010b?w=400&auto=format&fit=crop&q=80'
    },
    {
        id: 'gk',
        name: 'Electric Coral Goalkeeper Kit',
        description: 'High-visibility vibrant neon coral kit engineered for goalkeeper reach',
        primaryBg: '#F43F5E',
        stripeColor: null,
        accentColor: '#FFFFFF',
        collarColor: '#111827',
        imageUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&auto=format&fit=crop&q=80'
    }
];

export const formationCoordinates: Record<string, { roleLabel: string; top: string; left: string }[]> = {
    '4-4-1-1': [
        { roleLabel: 'GK', top: '85%', left: '50%' },
        { roleLabel: 'CB', top: '70%', left: '35%' },
        { roleLabel: 'CB', top: '70%', left: '65%' },
        { roleLabel: 'LB', top: '65%', left: '15%' },
        { roleLabel: 'RB', top: '65%', left: '85%' },
        { roleLabel: 'DMF', top: '48%', left: '40%' },
        { roleLabel: 'CMF', top: '48%', left: '60%' },
        { roleLabel: 'LMF', top: '42%', left: '15%' },
        { roleLabel: 'RMF', top: '42%', left: '85%' },
        { roleLabel: 'AMF', top: '24%', left: '50%' },
        { roleLabel: 'CF', top: '10%', left: '50%' }
    ],
    '4-3-3': [
        { roleLabel: 'GK', top: '85%', left: '50%' },
        { roleLabel: 'CB', top: '70%', left: '35%' },
        { roleLabel: 'CB', top: '70%', left: '65%' },
        { roleLabel: 'LB', top: '65%', left: '15%' },
        { roleLabel: 'RB', top: '65%', left: '85%' },
        { roleLabel: 'DM', top: '50%', left: '50%' },
        { roleLabel: 'CM', top: '35%', left: '30%' },
        { roleLabel: 'CM', top: '35%', left: '70%' },
        { roleLabel: 'LW', top: '15%', left: '20%' },
        { roleLabel: 'RW', top: '15%', left: '80%' },
        { roleLabel: 'CF', top: '10%', left: '50%' }
    ]
};

