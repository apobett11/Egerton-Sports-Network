import type { Match, Team, Player, NewsItem, LeagueTableEntry } from './types';

// Mock Teams
export const teams: Record<string, Team> = {
    foa: {
        id: 'foa',
        name: 'Faculty of Arts',
        shortName: 'FOA',
        logo: 'https://api.dicebear.com/7.x/initials/svg?seed=FOA&backgroundColor=059669', // Emerald
        colorCode: '#059669',
    },
    fos: {
        id: 'fos',
        name: 'Faculty of Science',
        shortName: 'FOS',
        logo: 'https://api.dicebear.com/7.x/initials/svg?seed=FOS&backgroundColor=2563eb', // Blue
        colorCode: '#2563eb',
    },
    shk: {
        id: 'shk',
        name: 'Egerton Sharklets',
        shortName: 'SHK',
        logo: 'https://api.dicebear.com/7.x/initials/svg?seed=SHK&backgroundColor=ea580c', // Orange
        colorCode: '#ea580c',
    },
    njr: {
        id: 'njr',
        name: 'Njoro FC',
        shortName: 'NJR',
        logo: 'https://api.dicebear.com/7.x/initials/svg?seed=NJR&backgroundColor=dc2626', // Red
        colorCode: '#dc2626',
    },
    edu: {
        id: 'edu',
        name: 'Faculty of Education',
        shortName: 'EDU',
        logo: 'https://api.dicebear.com/7.x/initials/svg?seed=EDU&backgroundColor=ca8a04', // Yellow
        colorCode: '#ca8a04',
    },
    fag: {
        id: 'fag',
        name: 'Faculty of Agriculture',
        shortName: 'FAG',
        logo: 'https://api.dicebear.com/7.x/initials/svg?seed=FAG&backgroundColor=16a34a', // Green
        colorCode: '#16a34a',
    },
    est: {
        id: 'est',
        name: 'Egerton Staff FC',
        shortName: 'EST',
        logo: 'https://api.dicebear.com/7.x/initials/svg?seed=EST&backgroundColor=4b5563', // Grey
        colorCode: '#4b5563',
    }
};

// Lineups helper generator
const generateLineup = (teamId: string, teamName: string, _isA: boolean): Player[] => {
    const prefix = teamName.substring(0, 3).toUpperCase();
    const positions: ('GK' | 'DEF' | 'MID' | 'FWD')[] = [
        'GK',
        'DEF', 'DEF', 'DEF', 'DEF',
        'MID', 'MID', 'MID',
        'FWD', 'FWD', 'FWD'
    ];

    const players: Player[] = [];

    // Lineup Starters (11 players)
    positions.forEach((pos, idx) => {
        let number = idx + 1;
        if (pos === 'GK') number = 1;
        else if (pos === 'DEF') number = 2 + (idx - 1);
        else if (pos === 'MID') number = 6 + (idx - 5);
        else number = 9 + (idx - 8);

        players.push({
            id: `${teamId}_p_${idx + 1}`,
            name: `${prefix} Player ${number}`,
            number,
            position: pos,
            isCaptain: idx === 4, // Make number 5 or custom captain
            isSub: false,
        });
    });

    // Subs (5 players)
    const subPositions: ('GK' | 'DEF' | 'MID' | 'FWD')[] = ['GK', 'DEF', 'MID', 'MID', 'FWD'];
    subPositions.forEach((pos, idx) => {
        players.push({
            id: `${teamId}_p_sub_${idx + 1}`,
            name: `${prefix} Sub ${idx + 12}`,
            number: idx + 12,
            position: pos,
            isCaptain: false,
            isSub: true,
        });
    });

    return players;
};

// Mock Matches
export const mockMatches: Match[] = [
    {
        id: 'm1',
        status: 'LIVE',
        time: '16:00',
        minute: "82'",
        league: 'Egerton Premier League',
        teamA: teams.foa,
        teamB: teams.fos,
        scoreA: 2,
        scoreB: 1,
        venue: 'Egerton Pavilion Stadium',
        referee: 'Prof. J. K. Kiprop',
        events: [
            { id: 'e1', minute: 14, type: 'goal', teamId: 'foa', playerId: 'foa_p_10', assistPlayerId: 'foa_p_8', detailText: 'FOA Player 10 (Assist: FOA Player 8)' },
            { id: 'e2', minute: 28, type: 'yellow', teamId: 'fos', playerId: 'fos_p_4', detailText: 'FOS Player 4 (Tactical Foul)' },
            { id: 'e3', minute: 42, type: 'yellow', teamId: 'foa', playerId: 'foa_p_6', detailText: 'FOA Player 6 (Argument)' },
            { id: 'e4', minute: 58, type: 'sub_in', teamId: 'fos', playerId: 'fos_p_sub_5', detailText: 'FOS Sub 16 IN / FOS Player 9 OUT' },
            { id: 'e5', minute: 61, type: 'goal', teamId: 'fos', playerId: 'fos_p_11', assistPlayerId: 'fos_p_7', detailText: 'FOS Player 11 (Header, Corner Kick)' },
            { id: 'e6', minute: 73, type: 'goal', teamId: 'foa', playerId: 'foa_p_9', detailText: 'FOA Player 9 (Penalty Shot)' },
            { id: 'e7', minute: 79, type: 'red', teamId: 'fos', playerId: 'fos_p_3', detailText: 'FOS Player 3 (Second Yellow / Red)' }
        ],
        stats: [
            { label: 'Possession (%)', teamAValue: 56, teamBValue: 44 },
            { label: 'Shots (Total)', teamAValue: 14, teamBValue: 8 },
            { label: 'Shots on Target', teamAValue: 6, teamBValue: 3 },
            { label: 'Corners', teamAValue: 5, teamBValue: 2 },
            { label: 'Fouls', teamAValue: 11, teamBValue: 15 },
            { label: 'Yellow Cards', teamAValue: 1, teamBValue: 2 },
            { label: 'Red Cards', teamAValue: 0, teamBValue: 1 },
            { label: 'Offsides', teamAValue: 2, teamBValue: 1 }
        ],
        lineups: {
            teamA: generateLineup('foa', 'Faculty of Arts', true),
            teamB: generateLineup('fos', 'Faculty of Science', false),
            formationA: '4-3-3',
            formationB: '4-3-3',
        }
    },
    {
        id: 'm2',
        status: 'FT',
        time: '14:00',
        minute: 'FT',
        league: 'Egerton Premier League',
        teamA: teams.shk,
        teamB: teams.njr,
        scoreA: 3,
        scoreB: 0,
        venue: 'Njoro Campus Pitch A',
        referee: 'Dr. Samuel Mwangi',
        events: [
            { id: 'm2_e1', minute: 5, type: 'goal', teamId: 'shk', playerId: 'shk_p_9', detailText: 'SHK Player 9' },
            { id: 'm2_e2', minute: 47, type: 'goal', teamId: 'shk', playerId: 'shk_p_10', detailText: 'SHK Player 10' },
            { id: 'm2_e3', minute: 88, type: 'goal', teamId: 'shk', playerId: 'shk_p_11', detailText: 'SHK Player 11' }
        ],
        stats: [
            { label: 'Possession (%)', teamAValue: 60, teamBValue: 40 },
            { label: 'Shots (Total)', teamAValue: 16, teamBValue: 6 },
            { label: 'Shots on Target', teamAValue: 8, teamBValue: 1 },
            { label: 'Corners', teamAValue: 7, teamBValue: 3 },
            { label: 'Fouls', teamAValue: 8, teamBValue: 12 }
        ],
        lineups: {
            teamA: generateLineup('shk', 'Egerton Sharklets', true),
            teamB: generateLineup('njr', 'Njoro FC', false),
            formationA: '4-4-2',
            formationB: '4-5-1',
        }
    },
    {
        id: 'm3',
        status: 'UPCOMING',
        time: '18:00',
        minute: '-',
        league: 'Egerton Premier League',
        teamA: teams.edu,
        teamB: teams.fag,
        scoreA: 0,
        scoreB: 0,
        venue: 'Egerton Pavilion Stadium',
        referee: 'Mrs. Emily Mutua',
        events: [],
        stats: [],
        lineups: {
            teamA: generateLineup('edu', 'Faculty of Education', true),
            teamB: generateLineup('fag', 'Faculty of Agriculture', false),
            formationA: '4-3-3',
            formationB: '3-5-2',
        }
    },
    {
        id: 'm4',
        status: 'HT',
        time: '15:30',
        minute: 'HT',
        league: 'Egerton Championships',
        teamA: teams.est,
        teamB: teams.njr,
        scoreA: 1,
        scoreB: 1,
        venue: 'Tatton Farm Ground',
        referee: 'Alex Ondieki',
        events: [
            { id: 'm4_e1', minute: 22, type: 'goal', teamId: 'est', playerId: 'est_p_10', detailText: 'EST Player 10' },
            { id: 'm4_e2', minute: 44, type: 'goal', teamId: 'njr', playerId: 'njr_p_8', detailText: 'NJR Player 8' }
        ],
        stats: [
            { label: 'Possession (%)', teamAValue: 50, teamBValue: 50 },
            { label: 'Shots (Total)', teamAValue: 5, teamBValue: 5 }
        ],
        lineups: {
            teamA: generateLineup('est', 'Egerton Staff FC', true),
            teamB: generateLineup('njr', 'Njoro FC', false),
            formationA: '4-4-2',
            formationB: '4-4-2',
        }
    },
    {
        id: 'm5',
        status: 'UPCOMING',
        time: 'Tomorrow',
        minute: '-',
        league: 'Special Games',
        teamA: teams.foa,
        teamB: teams.shk,
        scoreA: 0,
        scoreB: 0,
        venue: 'Egerton Pavilion Stadium',
        referee: 'W. Masinde',
        events: [],
        stats: [],
        lineups: {
            teamA: generateLineup('foa', 'Faculty of Arts', true),
            teamB: generateLineup('shk', 'Egerton Sharklets', false),
            formationA: '4-3-3',
            formationB: '4-3-3',
        }
    }
];

// Mock League Table
export const mockLeagueTable: LeagueTableEntry[] = [
    { position: 1, teamId: 'shk', teamName: 'Egerton Sharklets', teamLogo: teams.shk.logo, played: 12, won: 9, drawn: 2, lost: 1, goalsFor: 28, goalsAgainst: 8, goalDifference: 20, points: 29 },
    { position: 2, teamId: 'foa', teamName: 'Faculty of Arts', teamLogo: teams.foa.logo, played: 12, won: 8, drawn: 3, lost: 1, goalsFor: 22, goalsAgainst: 12, goalDifference: 10, points: 27 },
    { position: 3, teamId: 'fos', teamName: 'Faculty of Science', teamLogo: teams.fos.logo, played: 12, won: 7, drawn: 2, lost: 3, goalsFor: 24, goalsAgainst: 14, goalDifference: 10, points: 23 },
    { position: 4, teamId: 'edu', teamName: 'Faculty of Education', teamLogo: teams.edu.logo, played: 12, won: 6, drawn: 1, lost: 5, goalsFor: 18, goalsAgainst: 16, goalDifference: 2, points: 19 },
    { position: 5, teamId: 'fag', teamName: 'Faculty of Agriculture', teamLogo: teams.fag.logo, played: 12, won: 4, drawn: 3, lost: 5, goalsFor: 15, goalsAgainst: 17, goalDifference: -2, points: 15 },
    { position: 6, teamId: 'est', teamName: 'Egerton Staff FC', teamLogo: teams.est.logo, played: 12, won: 3, drawn: 2, lost: 7, goalsFor: 12, goalsAgainst: 22, goalDifference: -10, points: 11 },
    { position: 7, teamId: 'njr', teamName: 'Njoro FC', teamLogo: teams.njr.logo, played: 12, won: 1, drawn: 1, lost: 10, goalsFor: 8, goalsAgainst: 38, goalDifference: -30, points: 4 }
];

// Mock News & Transfers
export const mockNews: NewsItem[] = [
    {
        id: 'n1',
        title: 'Egerton Premier League: Sharklets Maintain Lead as FOA Pressures from Second Place',
        excerpt: 'In a stunning weekend of college football, the Egerton Sharklets clinched another crucial victory against Njoro FC, securing their position at the top of the standings.',
        imageUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=300',
        publishedAt: '2 hours ago',
        author: 'Dennis Omwamba',
        authorRole: 'Chief Sports Editor',
        verified: true,
        category: 'match_report'
    },
    {
        id: 'n2',
        title: 'TRANSFER ALERT: Njoro FC Eye Faculty of Agriculture Top Striker Ahead of Mid-Season Window',
        excerpt: 'Sources close to Njoro FC suggest the club is preparing a record student-sports scholarship package to sign the leading target man from the agricultural squad.',
        imageUrl: 'https://images.unsplash.com/photo-1517466787221-c750e3b97b0a?auto=format&fit=crop&q=80&w=300',
        publishedAt: '4 hours ago',
        author: 'Janet Chepkemoi',
        authorRole: 'Transfer Correspondent',
        verified: true,
        category: 'transfer'
    },
    {
        id: 'n3',
        title: 'Injury Update: Faculty of Science Playmaker Suffers Hamstring Tear, Out for Three Weeks',
        excerpt: 'The medical team at Egerton Sanatorium has confirmed that the scientific midfield maestro will miss the upcoming derby against FOA after scanning a grade one tear.',
        imageUrl: 'https://images.unsplash.com/photo-1540747737956-37872404a821?auto=format&fit=crop&q=80&w=300',
        publishedAt: 'Yesterday',
        author: 'Dr. Collins Kiprotic',
        authorRole: 'Sports Medicine Expert',
        verified: true,
        category: 'injury'
    },
    {
        id: 'n4',
        title: 'Egerton Pavilion Pitch Upgraded with New Floodlights for Night Matches',
        excerpt: 'The Dean of Students officially commissioned the installation of high-intensity LED floodlights, opening the door for late-evening fixtures and tournament finals.',
        imageUrl: 'https://images.unsplash.com/photo-1577223625856-758a127e1091?auto=format&fit=crop&q=80&w=300',
        publishedAt: '2 days ago',
        author: 'Admin Desk',
        authorRole: 'Egerton Media Group',
        verified: false,
        category: 'general'
    }
];
