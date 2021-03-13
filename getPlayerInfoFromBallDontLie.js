//https://www.balldontlie.io/api/v1/players?search=davis

//https://www.balldontlie.io/api/v1/players?page=1&per_page=100

//NB: next_page will be null once you get to the end of the pages

// {
//     "data":[
//       {
//         "id":237,
//         "first_name":"LeBron",
//         "last_name":"James",
//         "position":"F",
//         "height_feet": 6,
//         "height_inches": 8,
//         "weight_pounds": 250,
//         "team":{
//           "id":14,
//           "abbreviation":"LAL",
//           "city":"Los Angeles",
//           "conference":"West",
//           "division":"Pacific",
//           "full_name":"Los Angeles Lakers",
//           "name":"Lakers"
//         }
//       }
//       ...
//    ],
//    "meta": {
//       "total_pages": 50,
//       "current_page": 1,
//       "next_page": 2,
//       "per_page": 25,
//       "total_count": 9999
//     }
//   }

/////////////////////////////////////////////////////////////////////////////////////////

//https://www.balldontlie.io/api/v1/season_averages?player_ids[]=237

// {
//     "data": [
//       {
//         "games_played":37,
//         "player_id":237,
//         "season":2018,
//         "min":"34:46",
//         "fgm":9.92,
//         "fga":19.22,
//         "fg3m":2.05,
//         "fg3a":5.73,
//         "ftm":5.08,
//         "fta":7.54,
//         "oreb":0.95,
//         "dreb":7.59,
//         "reb":8.54,
//         "ast":7.38,
//         "stl":1.32,
//         "blk":0.65,
//         "turnover":3.49,
//         "pf":1.59,
//         "pts":26.97,
//         "fg_pct":0.516,
//         "fg3_pct":0.358,
//         "ft_pct":0.674
//       }
//     ]
//   }
