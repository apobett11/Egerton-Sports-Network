import { Player, Match, StandingEntry } from './types';

export const initialRoster: Player[] = [
    {
        id: 'p1',
        name: 'Marcus Thorne',
        number: 9,
        position: 'FW',
        rating: 84,
        cardImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCH4OnrkDGsUpqvgULuFMAhCevnm5zqoY0ZSV4fB9tAT88d5LeGuPkdwpGUewUI7mFSXAiq1oIaWaahr7dZoxNoSqzhvPKyKxuhceopc8iEZpplnXgKp8c0fzdTPjNtC5n63ReYiB4JeV8nWWrssCYIGnHDsG9JUeDD4JvqgKF30msmzTaTjEnotGhiXDrCS810dcxTFzxHHrOFgvvP_oz0KKI1Ha9gObf0j2OJQOfgml3pGuiC_GY_IZELT8aJQQGgvv5Oz4qYfIZF',
        status: 'Fit',
        goals: 14,
        speed: 88, shooting: 86, passing: 78, dribbling: 83, defense: 42, physical: 80, stamina: 82
    },
    {
        id: 'p2',
        name: 'Leo Van Dijk',
        number: 6,
        position: 'MD',
        rating: 79,
        cardImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC30mkEr9xgQLGbwomYYwVpb_KqEskdLkF20eOtsfCExB6qN7JblGq_gdl8YA34iTRIwNaSoFDmktNA89Rlk4LjXIxaQekjgA8hNokWkfTZ2qoFHnEyy1Mnykq1qgpv8Z0LhpSGL2gvec5ctG4EnRr0GTlCBK-QDIaO6zBhD0ozilHuA_EZ2Q7gyYEKueHuz6pRZkgQ7WWohY-5gDHhO-RY5bdioVWjkJLEJHplnXsDHRFfTBg1KrWRR9gEkVip5EsR3rtzENcT_C7Q',
        status: 'Fit',
        passPercent: 92.1,
        speed: 73, shooting: 68, passing: 89, dribbling: 81, defense: 74, physical: 72, stamina: 85
    },
    {
        id: 'p3',
        name: 'Aaron Sterling',
        number: 1,
        position: 'GK',
        rating: 81,
        cardImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC7WMQ10gFyuQWAXnqN9SS29DlD0-AMRYni04_nh288rVpEpC5FqGISgDRJv1n7-XCMVZBz0o6axB4S7QOoiwwbZtGrxqg8NLBeVrdi9PUY1yvwdVcM381-yPrPAYgNgTY2PFWvn_iLz32zoJdXyYTxdf8yTApkJ06XKNv7GFAXitmgaZz6-f-Q97e5HDLecGVtJSY8riMW2_zctESF8vX54bZLHmcjw3B5N6HubpTqK8yFhT041QykMvWZpgLTeSiZznyHMEFDZLwH',
        status: 'Recovering',
        saves: 42,
        speed: 55, shooting: 12, passing: 62, dribbling: 50, defense: 81, physical: 85, stamina: 65
    },
    {
        id: 'p4',
        name: 'Soren Brandt',
        number: 4,
        position: 'DF',
        rating: 76,
        cardImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDLy1LmEihrfzB8Wm7_rDb51ZKP7I_k0YlMXiZWvRa5RTyeUDxO1w-in-iqjQDnpWiYOhvDuJEJcDBkmN9SSp5VrIccAx3I8nkMcx7oa3wNJTL0M-zcncVs3XMTh87FLLUbWf--06YHlaYyPTE9OpKK5Tu85gRBVIcETuYgiwDQMMcdEDYgTqBZ1ClVmlWQ_e_6T_51OXDqu5nV8pr3thDNoE9SgctgQurzCnsMQgUEmj8bIOEJzbPfaSE-42erUp2Cs1kPiOAz4v2p',
        status: 'Fit',
        tackles: 68,
        speed: 74, shooting: 45, passing: 70, dribbling: 68, defense: 81, physical: 83, stamina: 80
    },
    {
        id: 'p5',
        name: 'E. Haaland',
        number: 9,
        position: 'FW',
        rating: 91,
        cardImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCH4OnrkDGsUpqvgULuFMAhCevnm5zqoY0ZSV4fB9tAT88d5LeGuPkdwpGUewUI7mFSXAiq1oIaWaahr7dZoxNoSqzhvPKyKxuhceopc8iEZpplnXgKp8c0fzdTPjNtC5n63ReYiB4JeV8nWWrssCYIGnHDsG9JUeDD4JvqgKF30msmzTaTjEnotGhiXDrCS810dcxTFzxHHrOFgvvP_oz0KKI1Ha9gObf0j2OJQOfgml3pGuiC_GY_IZELT8aJQQGgvv5Oz4qYfIZF',
        status: 'Fit',
        goals: 25,
        speed: 89, shooting: 93, passing: 65, dribbling: 80, defense: 38, physical: 88, stamina: 78
    },
    {
        id: 'p6',
        name: 'K. De Bruyne',
        number: 17,
        position: 'MD',
        rating: 90,
        cardImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC30mkEr9xgQLGbwomYYwVpb_KqEskdLkF20eOtsfCExB6qN7JblGq_gdl8YA34iTRIwNaSoFDmktNA89Rlk4LjXIxaQekjgA8hNokWkfTZ2qoFHnEyy1Mnykq1qgpv8Z0LhpSGL2gvec5ctG4EnRr0GTlCBK-QDIaO6zBhD0ozilHuA_EZ2Q7gyYEKueHuz6pRZkgQ7WWohY-5gDHhO-RY5bdioVWjkJLEJHplnXsDHRFfTBg1KrWRR9gEkVip5EsR3rtzENcT_C7Q',
        status: 'Fit',
        passPercent: 94.3,
        speed: 76, shooting: 82, passing: 94, dribbling: 87, defense: 64, physical: 75, stamina: 85
    },
    {
        id: 'p7',
        name: 'Rodri',
        number: 16,
        position: 'MD',
        rating: 89,
        cardImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC30mkEr9xgQLGbwomYYwVpb_KqEskdLkF20eOtsfCExB6qN7JblGq_gdl8YA34iTRIwNaSoFDmktNA89Rlk4LjXIxaQekjgA8hNokWkfTZ2qoFHnEyy1Mnykq1qgpv8Z0LhpSGL2gvec5ctG4EnRr0GTlCBK-QDIaO6zBhD0ozilHuA_EZ2Q7gyYEKueHuz6pRZkgQ7WWohY-5gDHhO-RY5bdioVWjkJLEJHplnXsDHRFfTBg1KrWRR9gEkVip5EsR3rtzENcT_C7Q',
        status: 'Fit',
        passPercent: 91.5,
        speed: 72, shooting: 73, passing: 84, dribbling: 79, defense: 88, physical: 84, stamina: 90
    },
    {
        id: 'p8',
        name: 'R. Diaz',
        number: 5,
        position: 'DF',
        rating: 88,
        cardImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDLy1LmEihrfzB8Wm7_rDb51ZKP7I_k0YlMXiZWvRa5RTyeUDxO1w-in-iqjQDnpWiYOhvDuJEJcDBkmN9SSp5VrIccAx3I8nkMcx7oa3wNJTL0M-zcncVs3XMTh87FLLUbWf--06YHlaYyPTE9OpKK5Tu85gRBVIcETuYgiwDQMMcdEDYgTqBZ1ClVmlWQ_e_6T_51OXDqu5nV8pr3thDNoE9SgctgQurzCnsMQgUEmj8bIOEJzbPfaSE-42erUp2Cs1kPiOAz4v2p',
        status: 'Fit',
        tackles: 74,
        speed: 73, shooting: 40, passing: 71, dribbling: 66, defense: 89, physical: 86, stamina: 82
    },
    {
        id: 'p9',
        name: 'P. Foden',
        number: 47,
        position: 'FW',
        rating: 86,
        cardImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCH4OnrkDGsUpqvgULuFMAhCevnm5zqoY0ZSV4fB9tAT88d5LeGuPkdwpGUewUI7mFSXAiq1oIaWaahr7dZoxNoSqzhvPKyKxuhceopc8iEZpplnXgKp8c0fzdTPjNtC5n63ReYiB4JeV8nWWrssCYIGnHDsG9JUeDD4JvqgKF30msmzTaTjEnotGhiXDrCS810dcxTFzxHHrOFgvvP_oz0KKI1Ha9gObf0j2OJQOfgml3pGuiC_GY_IZELT8aJQQGgvv5Oz4qYfIZF',
        status: 'Fit',
        goals: 12,
        speed: 84, shooting: 80, passing: 81, dribbling: 88, defense: 48, physical: 65, stamina: 80
    },
    {
        id: 'p10',
        name: 'J. Stones',
        number: 6,
        position: 'DF',
        rating: 85,
        cardImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDLy1LmEihrfzB8Wm7_rDb51ZKP7I_k0YlMXiZWvRa5RTyeUDxO1w-in-iqjQDnpWiYOhvDuJEJcDBkmN9SSp5VrIccAx3I8nkMcx7oa3wNJTL0M-zcncVs3XMTh87FLLUbWf--06YHlaYyPTE9OpKK5Tu85gRBVIcETuYgiwDQMMcdEDYgTqBZ1ClVmlWQ_e_6T_51OXDqu5nV8pr3thDNoE9SgctgQurzCnsMQgUEmj8bIOEJzbPfaSE-42erUp2Cs1kPiOAz4v2p',
        status: 'Fit',
        tackles: 62,
        speed: 73, shooting: 48, passing: 78, dribbling: 75, defense: 86, physical: 80, stamina: 82
    },
    {
        id: 'p11',
        name: 'T. Walker',
        number: 3,
        position: 'DF',
        rating: 84,
        cardImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDLy1LmEihrfzB8Wm7_rDb51ZKP7I_k0YlMXiZWvRa5RTyeUDxO1w-in-iqjQDnpWiYOhvDuJEJcDBkmN9SSp5VrIccAx3I8nkMcx7oa3wNJTL0M-zcncVs3XMTh87FLLUbWf--06YHlaYyPTE9OpKK5Tu85gRBVIcETuYgiwDQMMcdEDYgTqBZ1ClVmlWQ_e_6T_51OXDqu5nV8pr3thDNoE9SgctgQurzCnsMQgUEmj8bIOEJzbPfaSE-42erUp2Cs1kPiOAz4v2p',
        status: 'Fit',
        tackles: 58,
        speed: 91, shooting: 46, passing: 73, dribbling: 75, defense: 82, physical: 83, stamina: 84
    },
    {
        id: 'p12',
        name: 'J. Cancelo',
        number: 27,
        position: 'DF',
        rating: 84,
        cardImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDLy1LmEihrfzB8Wm7_rDb51ZKP7I_k0YlMXiZWvRa5RTyeUDxO1w-in-iqjQDnpWiYOhvDuJEJcDBkmN9SSp5VrIccAx3I8nkMcx7oa3wNJTL0M-zcncVs3XMTh81FLLUbWf--06YHlaYyPTE9OpKK5Tu85gRBVIcETuYgiwDQMMcdEDYgTqBZ1ClVmlWQ_e_6T_51OXDqu5nV8pr3thDNoE9SgctgQurzCnsMQgUEmj8bIOEJzbPfaSE-42erUp2Cs1kPiOAz4v2p',
        status: 'Fit',
        tackles: 50,
        speed: 80, shooting: 68, passing: 85, dribbling: 84, defense: 78, physical: 72, stamina: 82
    },
    {
        id: 'p13',
        name: 'B. Silva',
        number: 20,
        position: 'MD',
        rating: 86,
        cardImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC30mkEr9xgQLGbwomYYwVpb_KqEskdLkF20eOtsfCExB6qN7JblGq_gdl8YA34iTRIwNaSoFDmktNA89Rlk4LjXIxaQekjgA8hNokWkfTZ2qoFHnEyy1Mnykq1qgpv8Z0LhpSGL2gvec5ctG4EnRr0GTlCBK-QDIaO6zBhD0ozilHuA_EZ2Q7gyYEKueHuz6pRZkgQ7WWohY-5gDHhO-RY5bdioVWjkJLEJHplnXsDHRFfTBg1KrWRR9gEkVip5EsR3rtzENcT_C7Q',
        status: 'Fit',
        passPercent: 89.5,
        speed: 74, shooting: 70, passing: 85, dribbling: 88, defense: 69, physical: 67, stamina: 92
    },
    {
        id: 'p14',
        name: 'R. Mahrez',
        number: 26,
        position: 'FW',
        rating: 83,
        cardImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCH4OnrkDGsUpqvgULuFMAhCevnm5zqoY0ZSV4fB9tAT88d5LeGuPkdwpGUewUI7mFSXAiq1oIaWaahr7dZoxNoSqzhvPKyKxuhceopc8iEZpplnXgKp8c0fzdTPjNtC5n63ReYiB4JeV8nWWrssCYIGnHDsG9JUeDD4JvqgKF30msmzTaTjEnotGhiXDrCS810dcxTFzxHHrOFgvvP_oz0KKI1Ha9gObf0j2OJQOfgml3pGuiC_GY_IZELT8aJQQGgvv5Oz4qYfIZF',
        status: 'Fit',
        goals: 8,
        speed: 77, shooting: 79, passing: 81, dribbling: 87, defense: 38, physical: 60, stamina: 73
    },
    {
        id: 'p15',
        name: 'Jack Grealish',
        number: 10,
        position: 'MD',
        rating: 84,
        cardImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBa34kOCHqr4ClnIwSJt582pNXQoBG1w91YUhad2nyR9shPP42ozaznej7bnmSGWm2EX3foSaD7cSBhCkISwNg7Yp3E4rOZUmL6CpIGln6nFPPzPi0ZjVE2SeXG63StzGIIbEMXZ_mr0Ktqx8MbJrqbGsIlXN34Ozno1YVngINhKcEAY2yn1U67UNphlrUMSM1XDdXPOZrRuiHmh7ewpJ6L97XBAmwxF4DpW_sl46JnyzKXYF9n6raIMABWVb7L3vD8bjWpYTPfZ8Mr',
        status: 'Fit',
        passPercent: 87.2,
        speed: 76, shooting: 74, passing: 83, dribbling: 87, defense: 46, physical: 74, stamina: 79
    },
    {
        id: 'p16',
        name: 'Julian Alvarez',
        number: 19,
        position: 'FW',
        rating: 81,
        cardImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCo75jAejtIucTQgpZd_oqb2Q-smc5nYyKQUXCMeoymqHjQJ2DYt4NsgQTDiy2bvAEkNrlMJ8eArS-9f_IhAgLtm5c0zMKz_YAIxkr-BqhqQJhlZwjCSbNQ5UpQdtcl0e427B5WK4oVrlvKXyq5W1hkekTWjqPF2Mh14jMjhb6ra5E9TX6rGB2cNpDc5TBbzOXUcKCJV6dFC88RaK24OCWN0yBcmEtGJSgIr3GnX4L93tJ63rZdJVzJ6ddLHK91DeKeQrDumZiYyLpE',
        status: 'Fit',
        goals: 9,
        speed: 80, shooting: 82, passing: 74, dribbling: 79, defense: 40, physical: 72, stamina: 82
    },
    {
        id: 'p17',
        name: 'Ilkay Gundogan',
        number: 8,
        position: 'MD',
        rating: 85,
        cardImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDVVCJsAtcgSviheZZeZwWrKRiNa7toCHHiB6fwUkMd20LS705KUcOi5n5rN-WS7obiUzKbUJaQX6mBQ8gtI_-9xAH_PfA5dxUvECvLK-EMuPCesueLqwomWoDmL1JSWQL1I_7Q9DyC-Hq_eHm022ulL0EtBjBCxNyjENN_BEK8vIq17ACq2lL8ZI8WnWcNcJ_gWMOwp9FTXAcGj9iO8f3CplyLBTi5RLWHxbZL2iP8r1ayQI63Ya8EpBsqfPxMEKoPD-nGubDlIZRH',
        status: 'Fit',
        passPercent: 90.1,
        speed: 70, shooting: 78, passing: 86, dribbling: 82, defense: 72, physical: 71, stamina: 80
    },
    {
        id: 'p18',
        name: 'Nathan Aké',
        number: 6,
        position: 'DF',
        rating: 82,
        cardImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCxqPkg70uAbk-B4qmHMMY6M4NXDVfNCYokIdSh7NhDIH9g9FTQIIU8nMo1p55mOCFAhKWcqHvkGEsubWh0yzcEKB-PxBFMU9--frFvkxu2vBjCdnBi9JREmhQw-Dkc9pCgle1c7lToqQlxr7M7zcqudpzn9kW4gaNBH8MBUQ4IT9BeeW2MrlMqjCgVdLRAjt_RKbQFzrBgwsr-WD1j9viUMHFOUvkEmmDW6-Vqvu5ZfPgriofcBgHg1iZJ42QeC6G_S5msz2pPhi3y',
        status: 'Fit',
        tackles: 55,
        speed: 73, shooting: 40, passing: 72, dribbling: 68, defense: 83, physical: 80, stamina: 82
    },
    {
        id: 'p19',
        name: 'Stefan Ortega',
        number: 18,
        position: 'GK',
        rating: 80,
        cardImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAUF-M93JOlCVXKT05i0OG_x8cnLwULMX4nvpi8FoC0E9Kamj-Vv-duAFBX5v6Bzfm1sKBVNffoEkvM4NjHOMMNqvUhxgi5b5DthBLuLT9ti29raDmC8LKmxFs4N_wpVOjOWwOaRJA1glyhuf68ug6utZsvQUssZjkJEgsZ96n9uZkoQKo3KzY_nIwijiq5DtkiF2vX9z6BX9mtnAhXLk5RCSzPNA0IWSbCOMIrGSZu5peVKueqAII-8nbe1hSM5EefqoZwR4S-HUo5',
        status: 'Fit',
        saves: 15,
        speed: 50, shooting: 10, passing: 60, dribbling: 48, defense: 80, physical: 78, stamina: 60
    },
    {
        id: 'p20',
        name: 'Cole Palmer',
        number: 80,
        position: 'MD',
        rating: 82,
        cardImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBM_FJ0QFsjQjpMWtBAiuuwhDQ16KJtRDHdYC0plLxD2dC9Rt0CxktSVVGqXDDCGZL5vQqryO0vuUmB0jKiY8Mlnrp52Me146ijRo9Y5kBTCB93nHGlfIrJTVXE6nA8Y7iZ1jlvj12STqrE__pebBccQl6SsdMAVcbIVH_kihvTGFBLTuM7GdOJ-sWVGTfcqXeNGn-s5pGJrSzvv1xnJSTpMCr46SZ-jUKFZ9lQVdQo2ZOA1Po6BG8q7OCOLugznUipQm-gJrm7Me_4',
        status: 'Fit',
        goals: 7,
        speed: 80, shooting: 78, passing: 81, dribbling: 84, defense: 42, physical: 68, stamina: 78
    }
];

export const initialStandings: StandingEntry[] = [
    { position: 1, teamName: 'Man City', teamLogo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAjrVJAFLRUKw0UshaimwuZwsBygOz6PdS-8EQMBzeHkB7ESvkZIWtsqf-QKtQGWNSoynki4sQq7EoPEsS7IO8-DVHJR6wfgt2p1dEVxZaeorjyhrHVcDUxkZOXW37LQAZRH5p4SpLWys5jOcNBdx331HV6tbHZDoft3Gl9PrL1Wqi16CJYlQTvJ9sJ3Z5NJBPC_bJVo0EZcgBMvXV04oAhxLc1Rv9eCsz8NDVgTU5LwJ0LjRRkjwJHhq2aZGGFWJJI1eSqhtMOgdBT', played: 23, won: 16, drawn: 6, lost: 1, goalsFor: 52, goalsAgainst: 18, goalDifference: 34, points: 54, isCurrent: false },
    { position: 2, teamName: 'Liverpool', teamLogo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAjrVJAFLRUKw0UshaimwuZwsBygOz6PdS-8EQMBzeHkB7ESvkZIWtsqf-QKtQGWNSoynki4sQq7EoPEsS7IO8-DVHJR6wfgt2p1dEVxZaeorjyhrHVcDUxkZOXW37LQAZRH5p4SpLWys5jOcNBdx331HV6tbHZDoft3Gl9PrL1Wqi16CJYlQTvJ9sJ3Z5NJBPC_bJVo0EZcgBMvXV04oAhxLc1Rv9eCsz8NDVgTU5LwJ0LjRRkjwJHhq2aZGGFWJJI1eSqhtMOgdBT', played: 23, won: 15, drawn: 7, lost: 1, goalsFor: 50, goalsAgainst: 20, goalDifference: 30, points: 52, isCurrent: false },
    { position: 3, teamName: 'Arsenal', teamLogo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAjrVJAFLRUKw0UshaimwuZwsBygOz6PdS-8EQMBzeHkB7ESvkZIWtsqf-QKtQGWNSoynki4sQq7EoPEsS7IO8-DVHJR6wfgt2p1dEVxZaeorjyhrHVcDUxkZOXW37LQAZRH5p4SpLWys5jOcNBdx331HV6tbHZDoft3Gl9PrL1Wqi16CJYlQTvJ9sJ3Z5NJBPC_bJVo0EZcgBMvXV04oAhxLc1Rv9eCsz8NDVgTU5LwJ0LjRRkjwJHhq2aZGGFWJJI1eSqhtMOgdBT', played: 23, won: 15, drawn: 5, lost: 3, goalsFor: 44, goalsAgainst: 19, goalDifference: 25, points: 50, isCurrent: false },
    { position: 4, teamName: 'Egerton FC', teamLogo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC-CoQ5Af_r3SGnIMMbhez-XCx2C_zZYJIdIuwCi5QBbuNxnQc7gseVXUMG3l-B_R0pcMjinbwqtMBoaK7zN-vpXPyF61hw1hTtrDJXxrYpVPBDD6aHXh3pqvv4-8LkbYh6XqWCB2F0j9-PWvRHlabIjp9oCMBwaaLaPAZ2ViXFQnCCTQ1C1AZofwzs1QV5Tn5BCYqptq7gsAOo0e9Vh5Iiv12vZde1k3wGoWr3LyLzo1rhHXq_c8LLCkzata8JNH7jupNU1OISV_g4', played: 23, won: 14, drawn: 6, lost: 3, goalsFor: 42, goalsAgainst: 22, goalDifference: 20, points: 48, isCurrent: true },
    { position: 5, teamName: 'Tottenham', teamLogo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAjrVJAFLRUKw0UshaimwuZwsBygOz6PdS-8EQMBzeHkB7ESvkZIWtsqf-QKtQGWNSoynki4sQq7EoPEsS7IO8-DVHJR6wfgt2p1dEVxZaeorjyhrHVcDUxkZOXW37LQAZRH5p4SpLWys5jOcNBdx331HV6tbHZDoft3Gl9PrL1Wqi16CJYlQTvJ9sJ3Z5NJBPC_bJVo0EZcgBMvXV04oAhxLc1Rv9eCsz8NDVgTU5LwJ0LjRRkjwJHhq2aZGGFWJJI1eSqhtMOgdBT', played: 23, won: 13, drawn: 5, lost: 5, goalsFor: 41, goalsAgainst: 24, goalDifference: 17, points: 44, isCurrent: false },
    { position: 6, teamName: 'Chelsea', teamLogo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAjrVJAFLRUKw0UshaimwuZwsBygOz6PdS-8EQMBzeHkB7ESvkZIWtsqf-QKtQGWNSoynki4sQq7EoPEsS7IO8-DVHJR6wfgt2p1dEVxZaeorjyhrHVcDUxkZOXW37LQAZRH5p4SpLWys5jOcNBdx331HV6tbHZDoft3Gl9PrL1Wqi16CJYlQTvJ9sJ3Z5NJBPC_bJVo0EZcgBMvXV04oAhxLc1Rv9eCsz8NDVgTU5LwJ0LjRRkjwJHhq2aZGGFWJJI1eSqhtMOgdBT', played: 23, won: 11, drawn: 6, lost: 6, goalsFor: 38, goalsAgainst: 28, goalDifference: 10, points: 39, isCurrent: false },
    { position: 7, teamName: 'Newcastle', teamLogo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAjrVJAFLRUKw0UshaimwuZwsBygOz6PdS-8EQMBzeHkB7ESvkZIWtsqf-QKtQGWNSoynki4sQq7EoPEsS7IO8-DVHJR6wfgt2p1dEVxZaeorjyhrHVcDUxkZOXW37LQAZRH5p4SpLWys5jOcNBdx331HV6tbHZDoft3Gl9PrL1Wqi16CJYlQTvJ9sJ3Z5NJBPC_bJVo0EZcgBMvXV04oAhxLc1Rv9eCsz8NDVgTU5LwJ0LjRRkjwJHhq2aZGGFWJJI1eSqhtMOgdBT', played: 23, won: 10, drawn: 5, lost: 8, goalsFor: 35, goalsAgainst: 31, goalDifference: 4, points: 35, isCurrent: false }
];

export const initialFixtures: Match[] = [
    {
        id: 'f1',
        opponentName: 'North London',
        opponentLogo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAjrVJAFLRUKw0UshaimwuZwsBygOz6PdS-8EQMBzeHkB7ESvkZIWtsqf-QKtQGWNSoynki4sQq7EoPEsS7IO8-DVHJR6wfgt2p1dEVxZaeorjyhrHVcDUxkZOXW37LQAZRH5p4SpLWys5jOcNBdx331HV6tbHZDoft3Gl9PrL1Wqi16CJYlQTvJ9sJ3Z5NJBPC_bJVo0EZcgBMvXV04oAhxLc1Rv9eCsz8NDVgTU5LwJ0LjRRkjwJHhq2aZGGFWJJI1eSqhtMOgdBT',
        date: 'Saturday, Oct 14',
        time: '15:00',
        location: 'Emirates Stadium',
        league: 'Premier League',
        status: 'UPCOMING'
    },
    {
        id: 'f2',
        opponentName: 'Newcastle',
        opponentLogo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAjrVJAFLRUKw0UshaimwuZwsBygOz6PdS-8EQMBzeHkB7ESvkZIWtsqf-QKtQGWNSoynki4sQq7EoPEsS7IO8-DVHJR6wfgt2p1dEVxZaeorjyhrHVcDUxkZOXW37LQAZRH5p4SpLWys5jOcNBdx331HV6tbHZDoft3Gl9PrL1Wqi16CJYlQTvJ9sJ3Z5NJBPC_bJVo0EZcgBMvXV04oAhxLc1Rv9eCsz8NDVgTU5LwJ0LjRRkjwJHhq2aZGGFWJJI1eSqhtMOgdBT',
        date: 'Saturday, Oct 21',
        time: '12:30',
        location: 'St. James Park',
        league: 'Premier League',
        status: 'UPCOMING'
    },
    {
        id: 'f3',
        opponentName: 'Real Madrid',
        opponentLogo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAjrVJAFLRUKw0UshaimwuZwsBygOz6PdS-8EQMBzeHkB7ESvkZIWtsqf-QKtQGWNSoynki4sQq7EoPEsS7IO8-DVHJR6wfgt2p1dEVxZaeorjyhrHVcDUxkZOXW37LQAZRH5p4SpLWys5jOcNBdx331HV6tbHZDoft3Gl9PrL1Wqi16CJYlQTvJ9sJ3Z5NJBPC_bJVo0EZcgBMvXV04oAhxLc1Rv9eCsz8NDVgTU5LwJ0LjRRkjwJHhq2aZGGFWJJI1eSqhtMOgdBT',
        date: 'Tuesday, Oct 24',
        time: '20:00',
        location: 'Egerton Memorial Stadium',
        league: 'Champions League',
        status: 'UPCOMING'
    },
    {
        id: 'f4',
        opponentName: 'Chelsea',
        opponentLogo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAjrVJAFLRUKw0UshaimwuZwsBygOz6PdS-8EQMBzeHkB7ESvkZIWtsqf-QKtQGWNSoynki4sQq7EoPEsS7IO8-DVHJR6wfgt2p1dEVxZaeorjyhrHVcDUxkZOXW37LQAZRH5p4SpLWys5jOcNBdx331HV6tbHZDoft3Gl9PrL1Wqi16CJYlQTvJ9sJ3Z5NJBPC_bJVo0EZcgBMvXV04oAhxLc1Rv9eCsz8NDVgTU5LwJ0LjRRkjwJHhq2aZGGFWJJI1eSqhtMOgdBT',
        date: 'Saturday, Oct 28',
        time: '17:30',
        location: 'Stamford Bridge',
        league: 'Premier League',
        status: 'UPCOMING'
    },
    {
        id: 'f5',
        opponentName: 'Kingsley United',
        opponentLogo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAjrVJAFLRUKw0UshaimwuZwsBygOz6PdS-8EQMBzeHkB7ESvkZIWtsqf-QKtQGWNSoynki4sQq7EoPEsS7IO8-DVHJR6wfgt2p1dEVxZaeorjyhrHVcDUxkZOXW37LQAZRH5p4SpLWys5jOcNBdx331HV6tbHZDoft3Gl9PrL1Wqi16CJYlQTvJ9sJ3Z5NJBPC_bJVo0EZcgBMvXV04oAhxLc1Rv9eCsz8NDVgTU5LwJ0LjRRkjwJHhq2aZGGFWJJI1eSqhtMOgdBT',
        date: 'Wednesday, Nov 01',
        time: '19:45',
        location: 'Egerton Memorial Stadium',
        league: 'Premier League',
        status: 'UPCOMING'
    },
    {
        id: 'f_past_1',
        opponentName: 'West Ham',
        opponentLogo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAjrVJAFLRUKw0UshaimwuZwsBygOz6PdS-8EQMBzeHkB7ESvkZIWtsqf-QKtQGWNSoynki4sQq7EoPEsS7IO8-DVHJR6wfgt2p1dEVxZaeorjyhrHVcDUxkZOXW37LQAZRH5p4SpLWys5jOcNBdx331HV6tbHZDoft3Gl9PrL1Wqi16CJYlQTvJ9sJ3Z5NJBPC_bJVo0EZcgBMvXV04oAhxLc1Rv9eCsz8NDVgTU5LwJ0LjRRkjwJHhq2aZGGFWJJI1eSqhtMOgdBT',
        date: 'Sunday, Oct 08',
        time: '14:00',
        location: 'Egerton Memorial Stadium',
        league: 'Premier League',
        status: 'FINISHED',
        score: '3 - 1'
    },
    {
        id: 'f_past_2',
        opponentName: 'Crystal Palace',
        opponentLogo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAjrVJAFLRUKw0UshaimwuZwsBygOz6PdS-8EQMBzeHkB7ESvkZIWtsqf-QKtQGWNSoynki4sQq7EoPEsS7IO8-DVHJR6wfgt2p1dEVxZaeorjyhrHVcDUxkZOXW37LQAZRH5p4SpLWys5jOcNBdx331HV6tbHZDoft3Gl9PrL1Wqi16CJYlQTvJ9sJ3Z5NJBPC_bJVo0EZcgBMvXV04oAhxLc1Rv9eCsz8NDVgTU5LwJ0LjRRkjwJHhq2aZGGFWJJI1eSqhtMOgdBT',
        date: 'Saturday, Sep 30',
        time: '15:00',
        location: 'Selhurst Park',
        league: 'Premier League',
        status: 'FINISHED',
        score: '1 - 2'
    }
];

// Mapping structure for layouts
export const formationCoordinates: {
    [key: string]: { roleLabel: string; top: string; left: string }[];
} = {
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
    ],
    '4-2-3-1': [
        { roleLabel: 'GK', top: '85%', left: '50%' },
        { roleLabel: 'CB', top: '70%', left: '35%' },
        { roleLabel: 'CB', top: '70%', left: '65%' },
        { roleLabel: 'LB', top: '65%', left: '15%' },
        { roleLabel: 'RB', top: '65%', left: '85%' },
        { roleLabel: 'LDM', top: '50%', left: '38%' },
        { roleLabel: 'RDM', top: '50%', left: '62%' },
        { roleLabel: 'LAM', top: '30%', left: '22%' },
        { roleLabel: 'RAM', top: '30%', left: '78%' },
        { roleLabel: 'CAM', top: '28%', left: '50%' },
        { roleLabel: 'CF', top: '10%', left: '50%' }
    ],
    '4-4-2': [
        { roleLabel: 'GK', top: '85%', left: '50%' },
        { roleLabel: 'CB', top: '70%', left: '35%' },
        { roleLabel: 'CB', top: '70%', left: '65%' },
        { roleLabel: 'LB', top: '65%', left: '15%' },
        { roleLabel: 'RB', top: '65%', left: '85%' },
        { roleLabel: 'LM', top: '44%', left: '15%' },
        { roleLabel: 'CM', top: '46%', left: '38%' },
        { roleLabel: 'CM', top: '46%', left: '62%' },
        { roleLabel: 'RM', top: '44%', left: '85%' },
        { roleLabel: 'ST', top: '15%', left: '38%' },
        { roleLabel: 'ST', top: '15%', left: '62%' }
    ],
    '4-5-1': [
        { roleLabel: 'GK', top: '85%', left: '50%' },
        { roleLabel: 'CB', top: '70%', left: '35%' },
        { roleLabel: 'CB', top: '70%', left: '65%' },
        { roleLabel: 'LB', top: '65%', left: '15%' },
        { roleLabel: 'RB', top: '65%', left: '85%' },
        { roleLabel: 'DM', top: '52%', left: '50%' },
        { roleLabel: 'LM', top: '38%', left: '15%' },
        { roleLabel: 'CM', top: '38%', left: '38%' },
        { roleLabel: 'CM', top: '38%', left: '62%' },
        { roleLabel: 'RM', top: '38%', left: '85%' },
        { roleLabel: 'CF', top: '12%', left: '50%' }
    ],
    '3-5-2': [
        { roleLabel: 'GK', top: '85%', left: '50%' },
        { roleLabel: 'CB', top: '72%', left: '25%' },
        { roleLabel: 'CB', top: '74%', left: '50%' },
        { roleLabel: 'CB', top: '72%', left: '75%' },
        { roleLabel: 'LWB', top: '50%', left: '12%' },
        { roleLabel: 'DM', top: '52%', left: '50%' },
        { roleLabel: 'RWB', top: '50%', left: '88%' },
        { roleLabel: 'AM', top: '34%', left: '35%' },
        { roleLabel: 'AM', top: '34%', left: '65%' },
        { roleLabel: 'ST', top: '14%', left: '38%' },
        { roleLabel: 'ST', top: '14%', left: '62%' }
    ],
    '3-4-3': [
        { roleLabel: 'GK', top: '85%', left: '50%' },
        { roleLabel: 'CB', top: '72%', left: '25%' },
        { roleLabel: 'CB', top: '74%', left: '50%' },
        { roleLabel: 'CB', top: '72%', left: '75%' },
        { roleLabel: 'LM', top: '48%', left: '15%' },
        { roleLabel: 'CM', top: '48%', left: '38%' },
        { roleLabel: 'CM', top: '48%', left: '62%' },
        { roleLabel: 'RM', top: '48%', left: '85%' },
        { roleLabel: 'LW', top: '16%', left: '20%' },
        { roleLabel: 'RW', top: '16%', left: '80%' },
        { roleLabel: 'CF', top: '12%', left: '50%' }
    ],
    '5-3-2': [
        { roleLabel: 'GK', top: '85%', left: '50%' },
        { roleLabel: 'LWB', top: '65%', left: '12%' },
        { roleLabel: 'CB', top: '72%', left: '30%' },
        { roleLabel: 'CB', top: '74%', left: '50%' },
        { roleLabel: 'CB', top: '72%', left: '70%' },
        { roleLabel: 'RWB', top: '65%', left: '88%' },
        { roleLabel: 'CM', top: '45%', left: '30%' },
        { roleLabel: 'DM', top: '48%', left: '50%' },
        { roleLabel: 'CM', top: '45%', left: '70%' },
        { roleLabel: 'ST', top: '15%', left: '38%' },
        { roleLabel: 'ST', top: '15%', left: '62%' }
    ]
};

export const initialPracticeSchedule = [
    {
        id: 'ps1',
        day: 'Monday',
        time: '09:00 - 11:30',
        location: 'Main Pitch',
        activity: 'Gas drills & Footwork',
        assignedBy: 'Captain Leo'
    },
    {
        id: 'ps2',
        day: 'Wednesday',
        time: '10:00 - 12:30',
        location: 'Pitch 2',
        activity: 'Football control & Passing',
        assignedBy: 'Captain Leo'
    },
    {
        id: 'ps3',
        day: 'Friday',
        time: '15:00 - 17:00',
        location: 'Egerton Arena',
        activity: 'Pitch positioning & Tactical drills',
        assignedBy: 'Captain Leo'
    }
];

export const initialKits = [
    {
        id: 'away',
        name: 'Gold Trim Away Kit',
        description: 'Elegant white with vertical gold stripes and collar accent',
        primaryBg: '#FFFFFF',
        stripeColor: '#D4AF37',
        accentColor: '#101415',
        collarColor: '#D4AF37'
    },
    {
        id: 'home',
        name: 'Standard Home Kit',
        description: 'Elite gold with high-contrast slate stripes and details',
        primaryBg: '#D4AF37',
        stripeColor: '#1E293B',
        accentColor: '#FFFFFF',
        collarColor: '#1E293B'
    },
    {
        id: 'third',
        name: 'Midnight Third Kit',
        description: 'Stealth matte black with golden neon collar trim',
        primaryBg: '#101415',
        stripeColor: null,
        accentColor: '#D4AF37',
        collarColor: '#D4AF37'
    }
];
