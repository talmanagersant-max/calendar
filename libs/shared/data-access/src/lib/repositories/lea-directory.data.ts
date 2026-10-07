import { IDirectoryLea } from '../interfaces/lea.interface';

/**
 * LEA -> School directory behind the top-nav context switcher. Mock data transcribed from the
 * 2026-27 Public Charter School Directory (LEA ID, LEA name, Campus ID, campus name only).
 * LEAs that already exist in SampleDataRepository reuse its id so calendar data still scopes to them.
 *
 * Mock-only fields (not in the directory): `grades`/`gradeBand` are inferred from each campus name
 * (Elementary -> PK-5, Middle -> 6-8, High/Upper School -> 9-12, adult programs -> Adult, unknown -> PK-12),
 * and every `sites` entry - names and street addresses - is placeholder data.
 */
export const LEA_DIRECTORY: IDirectoryLea[] = [
  {
    id: 'lea-pcs-178',
    code: '178',
    name: 'Academy of Hope Adult PCS',
    schools: [
      {
        id: 'campus-233',
        code: '233',
        name: 'Academy of Hope Adult PCS',
        gradeBand: 'Adult',
        grades: ['Adult'],
        sites: [
          { id: 'site-233-1', code: '233-01', name: 'Main Campus', address: '3921 Kenilworth Ave NE, Washington, DC 20019' }
        ]
      }
    ]
  },
  {
    id: 'lea-achv',
    code: '155',
    name: 'Achievement Preparatory Academy PCS',
    schools: [
      {
        id: 'campus-217',
        code: '217',
        name: 'Achievement Preparatory Academy PCS - Wahler Place Elementary School',
        gradeBand: 'PK–5',
        grades: ['Pre-K', 'K', '1', '2', '3', '4', '5'],
        sites: [
          { id: 'site-217-1', code: '217-01', name: 'Main Campus', address: '3329 Florida Ave NE, Washington, DC 20002' },
          { id: 'site-217-2', code: '217-02', name: 'North Building', address: '3442 16th St NW, Washington, DC 20011' },
          { id: 'site-217-3', code: '217-03', name: 'South Building', address: '3555 Rhode Island Ave NE, Washington, DC 20018' }
        ]
      }
    ]
  },
  {
    id: 'lea-pcs-103',
    code: '103',
    name: 'AppleTree Early Learning PCS',
    schools: [
      {
        id: 'campus-140',
        code: '140',
        name: 'AppleTree Early Learning Center PCS - Columbia Heights',
        gradeBand: 'PK',
        grades: ['Pre-K'],
        sites: [
          { id: 'site-140-1', code: '140-01', name: 'Main Campus', address: '480 Georgia Ave NW, Washington, DC 20011' },
          { id: 'site-140-2', code: '140-02', name: 'North Building', address: '593 14th St NW, Washington, DC 20009' },
          { id: 'site-140-3', code: '140-03', name: 'South Building', address: '706 Good Hope Rd SE, Washington, DC 20020' }
        ]
      },
      {
        id: 'campus-3072',
        code: '3072',
        name: 'AppleTree Early Learning Center PCS - Douglas Knoll',
        gradeBand: 'PK',
        grades: ['Pre-K'],
        sites: [
          { id: 'site-3072-1', code: '3072-01', name: 'Main Campus', address: '3364 Florida Ave NE, Washington, DC 20002' }
        ]
      },
      {
        id: 'campus-3073',
        code: '3073',
        name: 'AppleTree Early Learning Center PCS - Lincoln Park',
        gradeBand: 'PK',
        grades: ['Pre-K'],
        sites: [
          { id: 'site-3073-1', code: '3073-01', name: 'Main Campus', address: '3401 Kenilworth Ave NE, Washington, DC 20019' },
          { id: 'site-3073-2', code: '3073-02', name: 'North Building', address: '3514 Kansas Ave NW, Washington, DC 20011' },
          { id: 'site-3073-3', code: '3073-03', name: 'South Building', address: '3627 Minnesota Ave SE, Washington, DC 20019' }
        ]
      },
      {
        id: 'campus-1137',
        code: '1137',
        name: 'AppleTree Early Learning Center PCS - Oklahoma Avenue',
        gradeBand: 'PK',
        grades: ['Pre-K'],
        sites: [
          { id: 'site-1137-1', code: '1137-01', name: 'Main Campus', address: '3769 Florida Ave NE, Washington, DC 20002' }
        ]
      },
      {
        id: 'campus-1069',
        code: '1069',
        name: 'AppleTree Early Learning Center PCS - Parklands at THEARC',
        gradeBand: 'PK',
        grades: ['Pre-K'],
        sites: [
          { id: 'site-1069-1', code: '1069-01', name: 'Main Campus', address: '1253 Brentwood Rd NE, Washington, DC 20018' }
        ]
      },
      {
        id: 'campus-141',
        code: '141',
        name: 'AppleTree Early Learning Center PCS - Southwest',
        gradeBand: 'PK',
        grades: ['Pre-K'],
        sites: [
          { id: 'site-141-1', code: '141-01', name: 'Main Campus', address: '517 Martin Luther King Jr Ave SE, Washington, DC 20020' }
        ]
      },
      {
        id: 'campus-3153',
        code: '3153',
        name: 'AppleTree Early Learning Center PCS - Spring Valley',
        gradeBand: 'PK',
        grades: ['Pre-K'],
        sites: [
          { id: 'site-3153-1', code: '3153-01', name: 'Main Campus', address: '1561 Kenilworth Ave NE, Washington, DC 20019' }
        ]
      },
      {
        id: 'campus-3155',
        code: '3155',
        name: 'AppleTree Early Learning Center PCS - Waterfront Station',
        gradeBand: 'PK',
        grades: ['Pre-K'],
        sites: [
          { id: 'site-3155-1', code: '3155-01', name: 'Main Campus', address: '1635 Georgia Ave NW, Washington, DC 20011' },
          { id: 'site-3155-2', code: '3155-02', name: 'Annex', address: '1748 14th St NW, Washington, DC 20009' }
        ]
      }
    ]
  },
  {
    id: 'lea-pcs-168',
    code: '168',
    name: 'BASIS DC PCS',
    schools: [
      {
        id: 'campus-3068',
        code: '3068',
        name: 'BASIS DC PCS',
        gradeBand: 'PK–12',
        grades: ['Pre-K', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
        sites: [
          { id: 'site-3068-1', code: '3068-01', name: 'Main Campus', address: '3216 Kenilworth Ave NE, Washington, DC 20019' }
        ]
      }
    ]
  },
  {
    id: 'lea-pcs-189',
    code: '189',
    name: 'Breakthrough Montessori PCS',
    schools: [
      {
        id: 'campus-289',
        code: '289',
        name: 'Breakthrough Montessori PCS',
        gradeBand: 'PK–6',
        grades: ['Pre-K', 'K', '1', '2', '3', '4', '5', '6'],
        sites: [
          { id: 'site-289-1', code: '289-01', name: 'Main Campus', address: '1193 Brentwood Rd NE, Washington, DC 20018' }
        ]
      }
    ]
  },
  {
    id: 'lea-pcs-107',
    code: '107',
    name: 'Bridges PCS',
    schools: [
      {
        id: 'campus-142',
        code: '142',
        name: 'Bridges PCS',
        gradeBand: 'PK–12',
        grades: ['Pre-K', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
        sites: [
          { id: 'site-142-1', code: '142-01', name: 'Main Campus', address: '554 Florida Ave NE, Washington, DC 20002' }
        ]
      }
    ]
  },
  {
    id: 'lea-pcs-119',
    code: '119',
    name: 'Briya PCS',
    schools: [
      {
        id: 'campus-126',
        code: '126',
        name: 'Briya PCS',
        gradeBand: 'Adult',
        grades: ['Adult'],
        sites: [
          { id: 'site-126-1', code: '126-01', name: 'Main Campus', address: '4762 Martin Luther King Jr Ave SE, Washington, DC 20020' },
          { id: 'site-126-2', code: '126-02', name: 'North Building', address: '4875 Alabama Ave SE, Washington, DC 20032' },
          { id: 'site-126-3', code: '126-03', name: 'South Building', address: '188 Nannie Helen Burroughs Ave NE, Washington, DC 20019' }
        ]
      }
    ]
  },
  {
    id: 'lea-pcs-108',
    code: '108',
    name: 'Capital City PCS',
    schools: [
      {
        id: 'campus-1207',
        code: '1207',
        name: 'Capital City PCS - High School',
        gradeBand: '9–12',
        grades: ['9', '10', '11', '12'],
        sites: [
          { id: 'site-1207-1', code: '1207-01', name: 'Main Campus', address: '1559 Florida Ave NE, Washington, DC 20002' }
        ]
      },
      {
        id: 'campus-184',
        code: '184',
        name: 'Capital City PCS - Lower School',
        gradeBand: 'PK–4',
        grades: ['Pre-K', 'K', '1', '2', '3', '4'],
        sites: [
          { id: 'site-184-1', code: '184-01', name: 'Main Campus', address: '2108 Brentwood Rd NE, Washington, DC 20018' }
        ]
      },
      {
        id: 'campus-182',
        code: '182',
        name: 'Capital City PCS - Middle School',
        gradeBand: '6–8',
        grades: ['6', '7', '8'],
        sites: [
          { id: 'site-182-1', code: '182-01', name: 'Main Campus', address: '2034 Florida Ave NE, Washington, DC 20002' },
          { id: 'site-182-2', code: '182-02', name: 'North Building', address: '2147 16th St NW, Washington, DC 20011' },
          { id: 'site-182-3', code: '182-03', name: 'South Building', address: '2260 Rhode Island Ave NE, Washington, DC 20018' }
        ]
      }
    ]
  },
  {
    id: 'lea-pcs-334',
    code: '334',
    name: 'Capital Village PCS',
    schools: [
      {
        id: 'campus-1145',
        code: '1145',
        name: 'Capital Village PCS',
        gradeBand: 'PK–12',
        grades: ['Pre-K', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
        sites: [
          { id: 'site-1145-1', code: '1145-01', name: 'Main Campus', address: '4065 Georgia Ave NW, Washington, DC 20011' },
          { id: 'site-1145-2', code: '1145-02', name: 'Annex', address: '4178 14th St NW, Washington, DC 20009' }
        ]
      }
    ]
  },
  {
    id: 'lea-pcs-162',
    code: '162',
    name: 'Carlos Rosario International PCS',
    schools: [
      {
        id: 'campus-1119',
        code: '1119',
        name: 'Carlos Rosario International PCS',
        gradeBand: 'Adult',
        grades: ['Adult'],
        sites: [
          { id: 'site-1119-1', code: '1119-01', name: 'Main Campus', address: '3103 Brentwood Rd NE, Washington, DC 20018' }
        ]
      }
    ]
  },
  {
    id: 'lea-pcs-123',
    code: '123',
    name: 'Cedar Tree Academy PCS',
    schools: [
      {
        id: 'campus-188',
        code: '188',
        name: 'Cedar Tree Academy PCS',
        gradeBand: 'PK–12',
        grades: ['Pre-K', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
        sites: [
          { id: 'site-188-1', code: '188-01', name: 'Main Campus', address: '2256 Kenilworth Ave NE, Washington, DC 20019' }
        ]
      }
    ]
  },
  {
    id: 'lea-pcs-156',
    code: '156',
    name: 'Center City PCS',
    schools: [
      {
        id: 'campus-1103',
        code: '1103',
        name: 'Center City PCS - Brightwood',
        gradeBand: 'PK–12',
        grades: ['Pre-K', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
        sites: [
          { id: 'site-1103-1', code: '1103-01', name: 'Main Campus', address: '2511 Kenilworth Ave NE, Washington, DC 20019' }
        ]
      },
      {
        id: 'campus-1104',
        code: '1104',
        name: 'Center City PCS - Capitol Hill',
        gradeBand: 'PK–12',
        grades: ['Pre-K', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
        sites: [
          { id: 'site-1104-1', code: '1104-01', name: 'Main Campus', address: '2548 Brentwood Rd NE, Washington, DC 20018' }
        ]
      },
      {
        id: 'campus-1105',
        code: '1105',
        name: 'Center City PCS - Congress Heights',
        gradeBand: 'PK–12',
        grades: ['Pre-K', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
        sites: [
          { id: 'site-1105-1', code: '1105-01', name: 'Main Campus', address: '2585 Georgia Ave NW, Washington, DC 20011' },
          { id: 'site-1105-2', code: '1105-02', name: 'Annex', address: '2698 14th St NW, Washington, DC 20009' }
        ]
      },
      {
        id: 'campus-1108',
        code: '1108',
        name: 'Center City PCS - NoMa',
        gradeBand: 'PK–12',
        grades: ['Pre-K', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
        sites: [
          { id: 'site-1108-1', code: '1108-01', name: 'Main Campus', address: '2696 Kenilworth Ave NE, Washington, DC 20019' }
        ]
      },
      {
        id: 'campus-1106',
        code: '1106',
        name: 'Center City PCS - Petworth',
        gradeBand: 'PK–12',
        grades: ['Pre-K', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
        sites: [
          { id: 'site-1106-1', code: '1106-01', name: 'Main Campus', address: '2622 Martin Luther King Jr Ave SE, Washington, DC 20020' },
          { id: 'site-1106-2', code: '1106-02', name: 'North Building', address: '2735 Alabama Ave SE, Washington, DC 20032' },
          { id: 'site-1106-3', code: '1106-03', name: 'South Building', address: '2848 Nannie Helen Burroughs Ave NE, Washington, DC 20019' }
        ]
      },
      {
        id: 'campus-1107',
        code: '1107',
        name: 'Center City PCS - Shaw',
        gradeBand: 'PK–12',
        grades: ['Pre-K', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
        sites: [
          { id: 'site-1107-1', code: '1107-01', name: 'Main Campus', address: '2659 Florida Ave NE, Washington, DC 20002' }
        ]
      }
    ]
  },
  {
    id: 'lea-pcs-109',
    code: '109',
    name: 'Cesar Chavez PCS for Public Policy',
    schools: [
      {
        id: 'campus-109',
        code: '109',
        name: 'Cesar Chavez Public Charter Schools for Public Policy',
        gradeBand: 'PK–12',
        grades: ['Pre-K', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
        sites: [
          { id: 'site-109-1', code: '109-01', name: 'Main Campus', address: '4133 Brentwood Rd NE, Washington, DC 20018' }
        ]
      }
    ]
  },
  {
    id: 'lea-pcs-176',
    code: '176',
    name: 'Community College Preparatory Academy PCS',
    schools: [
      {
        id: 'campus-216',
        code: '216',
        name: 'Community College Preparatory Academy PCS',
        gradeBand: 'Adult',
        grades: ['Adult'],
        sites: [
          { id: 'site-216-1', code: '216-01', name: 'Main Campus', address: '3292 Martin Luther King Jr Ave SE, Washington, DC 20020' }
        ]
      }
    ]
  },
  {
    id: 'lea-pcs-169',
    code: '169',
    name: 'Creative Minds International PCS',
    schools: [
      {
        id: 'campus-3069',
        code: '3069',
        name: 'Creative Minds International PCS',
        gradeBand: 'PK–12',
        grades: ['Pre-K', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
        sites: [
          { id: 'site-3069-1', code: '3069-01', name: 'Main Campus', address: '3253 Brentwood Rd NE, Washington, DC 20018' }
        ]
      }
    ]
  },
  {
    id: 'lea-pcs-114',
    code: '114',
    name: 'DC Bilingual PCS',
    schools: [
      {
        id: 'campus-199',
        code: '199',
        name: 'DC Bilingual PCS',
        gradeBand: 'PK–12',
        grades: ['Pre-K', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
        sites: [
          { id: 'site-199-1', code: '199-01', name: 'Main Campus', address: '2663 Brentwood Rd NE, Washington, DC 20018' }
        ]
      }
    ]
  },
  {
    id: 'lea-pcs-115',
    code: '115',
    name: 'DC Prep PCS',
    schools: [
      {
        id: 'campus-276',
        code: '276',
        name: 'DC Prep PCS - Anacostia Elementary School',
        gradeBand: 'PK–5',
        grades: ['Pre-K', 'K', '1', '2', '3', '4', '5'],
        sites: [
          { id: 'site-276-1', code: '276-01', name: 'Main Campus', address: '712 Martin Luther King Jr Ave SE, Washington, DC 20020' }
        ]
      },
      {
        id: 'campus-1151',
        code: '1151',
        name: 'DC Prep PCS - Anacostia Middle School',
        gradeBand: '6–8',
        grades: ['6', '7', '8'],
        sites: [
          { id: 'site-1151-1', code: '1151-01', name: 'Main Campus', address: '4287 Martin Luther King Jr Ave SE, Washington, DC 20020' }
        ]
      },
      {
        id: 'campus-1110',
        code: '1110',
        name: 'DC Prep PCS - Benning Elementary School',
        gradeBand: 'PK–5',
        grades: ['Pre-K', 'K', '1', '2', '3', '4', '5'],
        sites: [
          { id: 'site-1110-1', code: '1110-01', name: 'Main Campus', address: '2770 Georgia Ave NW, Washington, DC 20011' },
          { id: 'site-1110-2', code: '1110-02', name: 'Annex', address: '2883 14th St NW, Washington, DC 20009' }
        ]
      },
      {
        id: 'campus-218',
        code: '218',
        name: 'DC Prep PCS - Benning Middle School',
        gradeBand: '6–8',
        grades: ['6', '7', '8'],
        sites: [
          { id: 'site-218-1', code: '218-01', name: 'Main Campus', address: '3366 Kenilworth Ave NE, Washington, DC 20019' }
        ]
      },
      {
        id: 'campus-130',
        code: '130',
        name: 'DC Prep PCS - Edgewood Elementary School',
        gradeBand: 'PK–5',
        grades: ['Pre-K', 'K', '1', '2', '3', '4', '5'],
        sites: [
          { id: 'site-130-1', code: '130-01', name: 'Main Campus', address: '110 Georgia Ave NW, Washington, DC 20011' },
          { id: 'site-130-2', code: '130-02', name: 'Annex', address: '223 14th St NW, Washington, DC 20009' }
        ]
      },
      {
        id: 'campus-196',
        code: '196',
        name: 'DC Prep PCS - Edgewood Middle School',
        gradeBand: '6–8',
        grades: ['6', '7', '8'],
        sites: [
          { id: 'site-196-1', code: '196-01', name: 'Main Campus', address: '2552 Martin Luther King Jr Ave SE, Washington, DC 20020' },
          { id: 'site-196-2', code: '196-02', name: 'North Building', address: '2665 Alabama Ave SE, Washington, DC 20032' },
          { id: 'site-196-3', code: '196-03', name: 'South Building', address: '2778 Nannie Helen Burroughs Ave NE, Washington, DC 20019' }
        ]
      }
    ]
  },
  {
    id: 'lea-pcs-170',
    code: '170',
    name: 'DC Scholars PCS',
    schools: [
      {
        id: 'campus-3070',
        code: '3070',
        name: 'DC Scholars PCS',
        gradeBand: 'PK–12',
        grades: ['Pre-K', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
        sites: [
          { id: 'site-3070-1', code: '3070-01', name: 'Main Campus', address: '3290 Georgia Ave NW, Washington, DC 20011' },
          { id: 'site-3070-2', code: '3070-02', name: 'Annex', address: '3403 14th St NW, Washington, DC 20009' }
        ]
      }
    ]
  },
  {
    id: 'lea-pcs-359',
    code: '359',
    name: 'DC Wildflower PCS',
    schools: [
      {
        id: 'campus-1176',
        code: '1176',
        name: 'DC Wildflower PCS',
        gradeBand: 'PK–12',
        grades: ['Pre-K', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
        sites: [
          { id: 'site-1176-1', code: '1176-01', name: 'Main Campus', address: '412 Martin Luther King Jr Ave SE, Washington, DC 20020' },
          { id: 'site-1176-2', code: '1176-02', name: 'North Building', address: '525 Alabama Ave SE, Washington, DC 20032' },
          { id: 'site-1176-3', code: '1176-03', name: 'South Building', address: '638 Nannie Helen Burroughs Ave NE, Washington, DC 20019' }
        ]
      }
    ]
  },
  {
    id: 'lea-pcs-317',
    code: '317',
    name: 'Digital Pioneers Academy PCS',
    schools: [
      {
        id: 'campus-1212',
        code: '1212',
        name: 'Digital Pioneers Academy PCS - Capitol Hill',
        gradeBand: 'PK–12',
        grades: ['Pre-K', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
        sites: [
          { id: 'site-1212-1', code: '1212-01', name: 'Main Campus', address: '1744 Florida Ave NE, Washington, DC 20002' }
        ]
      },
      {
        id: 'campus-1038',
        code: '1038',
        name: 'Digital Pioneers Academy PCS - Johenning',
        gradeBand: 'PK–12',
        grades: ['Pre-K', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
        sites: [
          { id: 'site-1038-1', code: '1038-01', name: 'Main Campus', address: '106 Kenilworth Ave NE, Washington, DC 20019' }
        ]
      }
    ]
  },
  {
    id: 'lea-pcs-181',
    code: '181',
    name: 'District of Columbia International School',
    schools: [
      {
        id: 'campus-248',
        code: '248',
        name: 'District of Columbia International School',
        gradeBand: 'PK–12',
        grades: ['Pre-K', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
        sites: [
          { id: 'site-248-1', code: '248-01', name: 'Main Campus', address: '4476 Kenilworth Ave NE, Washington, DC 20019' }
        ]
      }
    ]
  },
  {
    id: 'lea-pcs-116',
    code: '116',
    name: 'E.L. Haynes PCS',
    schools: [
      {
        id: 'campus-1206',
        code: '1206',
        name: 'E.L. Haynes PCS - Elementary School',
        gradeBand: 'PK–5',
        grades: ['Pre-K', 'K', '1', '2', '3', '4', '5'],
        sites: [
          { id: 'site-1206-1', code: '1206-01', name: 'Main Campus', address: '1522 Martin Luther King Jr Ave SE, Washington, DC 20020' }
        ]
      },
      {
        id: 'campus-1138',
        code: '1138',
        name: 'E.L. Haynes PCS - High School',
        gradeBand: '9–12',
        grades: ['9', '10', '11', '12'],
        sites: [
          { id: 'site-1138-1', code: '1138-01', name: 'Main Campus', address: '3806 Kenilworth Ave NE, Washington, DC 20019' }
        ]
      },
      {
        id: 'campus-146',
        code: '146',
        name: 'E.L. Haynes PCS - Middle School',
        gradeBand: '6–8',
        grades: ['6', '7', '8'],
        sites: [
          { id: 'site-146-1', code: '146-01', name: 'Main Campus', address: '702 Martin Luther King Jr Ave SE, Washington, DC 20020' }
        ]
      }
    ]
  },
  {
    id: 'lea-pcs-118',
    code: '118',
    name: 'Early Childhood Academy PCS',
    schools: [
      {
        id: 'campus-138',
        code: '138',
        name: 'Early Childhood Academy PCS',
        gradeBand: 'PK–3',
        grades: ['Pre-K', 'K', '1', '2', '3'],
        sites: [
          { id: 'site-138-1', code: '138-01', name: 'Main Campus', address: '406 Kenilworth Ave NE, Washington, DC 20019' }
        ]
      }
    ]
  },
  {
    id: 'lea-pcs-144',
    code: '144',
    name: 'Elsie Whitlow Stokes Community Freedom PCS',
    schools: [
      {
        id: 'campus-159',
        code: '159',
        name: 'Elsie Whitlow Stokes Community Freedom PCS - Brookland',
        gradeBand: 'PK–12',
        grades: ['Pre-K', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
        sites: [
          { id: 'site-159-1', code: '159-01', name: 'Main Campus', address: '1183 Brentwood Rd NE, Washington, DC 20018' }
        ]
      },
      {
        id: 'campus-1059',
        code: '1059',
        name: 'Elsie Whitlow Stokes Community Freedom PCS - East End',
        gradeBand: 'PK–12',
        grades: ['Pre-K', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
        sites: [
          { id: 'site-1059-1', code: '1059-01', name: 'Main Campus', address: '883 Brentwood Rd NE, Washington, DC 20018' }
        ]
      }
    ]
  },
  {
    id: 'lea-frnd',
    code: '120',
    name: 'Friendship PCS',
    schools: [
      {
        id: 'campus-269',
        code: '269',
        name: 'Friendship PCS - Armstrong Elementary',
        gradeBand: 'PK–5',
        grades: ['Pre-K', 'K', '1', '2', '3', '4', '5'],
        sites: [
          { id: 'site-269-1', code: '269-01', name: 'Main Campus', address: '453 Brentwood Rd NE, Washington, DC 20018' }
        ]
      },
      {
        id: 'campus-1140',
        code: '1140',
        name: 'Friendship PCS - Armstrong Middle',
        gradeBand: '6–8',
        grades: ['6', '7', '8'],
        sites: [
          { id: 'site-1140-1', code: '1140-01', name: 'Main Campus', address: '3880 Georgia Ave NW, Washington, DC 20011' },
          { id: 'site-1140-2', code: '1140-02', name: 'Annex', address: '3993 14th St NW, Washington, DC 20009' }
        ]
      },
      {
        id: 'campus-361',
        code: '361',
        name: 'Friendship PCS - Blow Pierce Elementary',
        gradeBand: 'PK–5',
        grades: ['Pre-K', 'K', '1', '2', '3', '4', '5'],
        sites: [
          { id: 'site-361-1', code: '361-01', name: 'Main Campus', address: '3857 Martin Luther King Jr Ave SE, Washington, DC 20020' }
        ]
      },
      {
        id: 'campus-362',
        code: '362',
        name: 'Friendship PCS - Blow Pierce Middle',
        gradeBand: '6–8',
        grades: ['6', '7', '8'],
        sites: [
          { id: 'site-362-1', code: '362-01', name: 'Main Campus', address: '3894 Florida Ave NE, Washington, DC 20002' }
        ]
      },
      {
        id: 'campus-363',
        code: '363',
        name: 'Friendship PCS - Chamberlain Elementary',
        gradeBand: 'PK–5',
        grades: ['Pre-K', 'K', '1', '2', '3', '4', '5'],
        sites: [
          { id: 'site-363-1', code: '363-01', name: 'Main Campus', address: '3931 Kenilworth Ave NE, Washington, DC 20019' }
        ]
      },
      {
        id: 'campus-364',
        code: '364',
        name: 'Friendship PCS - Chamberlain Middle',
        gradeBand: '6–8',
        grades: ['6', '7', '8'],
        sites: [
          { id: 'site-364-1', code: '364-01', name: 'Main Campus', address: '3968 Brentwood Rd NE, Washington, DC 20018' },
          { id: 'site-364-2', code: '364-02', name: 'North Building', address: '4081 Benning Rd NE, Washington, DC 20019' },
          { id: 'site-364-3', code: '364-03', name: 'South Building', address: '4194 Pennsylvania Ave SE, Washington, DC 20003' }
        ]
      },
      {
        id: 'campus-186',
        code: '186',
        name: 'Friendship PCS - Collegiate Academy',
        gradeBand: '9–12',
        grades: ['9', '10', '11', '12'],
        sites: [
          { id: 'site-186-1', code: '186-01', name: 'Main Campus', address: '2182 Martin Luther King Jr Ave SE, Washington, DC 20020' }
        ]
      },
      {
        id: 'campus-1083',
        code: '1083',
        name: 'Friendship PCS - Ideal Elementary',
        gradeBand: 'PK–5',
        grades: ['Pre-K', 'K', '1', '2', '3', '4', '5'],
        sites: [
          { id: 'site-1083-1', code: '1083-01', name: 'Main Campus', address: '1771 Kenilworth Ave NE, Washington, DC 20019' }
        ]
      },
      {
        id: 'campus-1084',
        code: '1084',
        name: 'Friendship PCS - Ideal Middle',
        gradeBand: '6–8',
        grades: ['6', '7', '8'],
        sites: [
          { id: 'site-1084-1', code: '1084-01', name: 'Main Campus', address: '1808 Brentwood Rd NE, Washington, DC 20018' }
        ]
      },
      {
        id: 'campus-268',
        code: '268',
        name: 'Friendship PCS - Online Academy',
        gradeBand: 'K–12',
        grades: ['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
        sites: [
          { id: 'site-268-1', code: '268-01', name: 'Main Campus', address: '416 Kenilworth Ave NE, Washington, DC 20019' }
        ]
      },
      {
        id: 'campus-113',
        code: '113',
        name: 'Friendship PCS - Southeast Elementary',
        gradeBand: 'PK–5',
        grades: ['Pre-K', 'K', '1', '2', '3', '4', '5'],
        sites: [
          { id: 'site-113-1', code: '113-01', name: 'Main Campus', address: '4281 Kenilworth Ave NE, Washington, DC 20019' }
        ]
      },
      {
        id: 'campus-1057',
        code: '1057',
        name: 'Friendship PCS - Southeast Middle',
        gradeBand: '6–8',
        grades: ['6', '7', '8'],
        sites: [
          { id: 'site-1057-1', code: '1057-01', name: 'Main Campus', address: '809 Florida Ave NE, Washington, DC 20002' },
          { id: 'site-1057-2', code: '1057-02', name: 'North Building', address: '922 16th St NW, Washington, DC 20011' },
          { id: 'site-1057-3', code: '1057-03', name: 'South Building', address: '1035 Rhode Island Ave NE, Washington, DC 20018' }
        ]
      },
      {
        id: 'campus-1164',
        code: '1164',
        name: 'Friendship PCS - Technology Preparatory High School',
        gradeBand: '9–12',
        grades: ['9', '10', '11', '12'],
        sites: [
          { id: 'site-1164-1', code: '1164-01', name: 'Main Campus', address: '4768 Brentwood Rd NE, Washington, DC 20018' }
        ]
      },
      {
        id: 'campus-365',
        code: '365',
        name: 'Friendship PCS - Woodridge International Elementary',
        gradeBand: 'PK–5',
        grades: ['Pre-K', 'K', '1', '2', '3', '4', '5'],
        sites: [
          { id: 'site-365-1', code: '365-01', name: 'Main Campus', address: '4005 Georgia Ave NW, Washington, DC 20011' },
          { id: 'site-365-2', code: '365-02', name: 'Annex', address: '4118 14th St NW, Washington, DC 20009' }
        ]
      },
      {
        id: 'campus-366',
        code: '366',
        name: 'Friendship PCS - Woodridge International Middle',
        gradeBand: '6–8',
        grades: ['6', '7', '8'],
        sites: [
          { id: 'site-366-1', code: '366-01', name: 'Main Campus', address: '4042 Martin Luther King Jr Ave SE, Washington, DC 20020' }
        ]
      }
    ]
  },
  {
    id: 'lea-pcs-340',
    code: '340',
    name: 'Girls Global Academy PCS',
    schools: [
      {
        id: 'campus-1146',
        code: '1146',
        name: 'Girls Global Academy PCS',
        gradeBand: 'PK–12',
        grades: ['Pre-K', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
        sites: [
          { id: 'site-1146-1', code: '1146-01', name: 'Main Campus', address: '4102 Martin Luther King Jr Ave SE, Washington, DC 20020' }
        ]
      }
    ]
  },
  {
    id: 'lea-pcs-357',
    code: '357',
    name: 'Global Citizens PCS',
    schools: [
      {
        id: 'campus-1160',
        code: '1160',
        name: 'Global Citizens PCS',
        gradeBand: 'PK–12',
        grades: ['Pre-K', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
        sites: [
          { id: 'site-1160-1', code: '1160-01', name: 'Main Campus', address: '4620 Georgia Ave NW, Washington, DC 20011' },
          { id: 'site-1160-2', code: '1160-02', name: 'Annex', address: '4733 14th St NW, Washington, DC 20009' }
        ]
      }
    ]
  },
  {
    id: 'lea-pcs-190',
    code: '190',
    name: 'Goodwill Excel Center PCS',
    schools: [
      {
        id: 'campus-297',
        code: '297',
        name: 'Goodwill Excel Center PCS',
        gradeBand: 'Adult',
        grades: ['Adult'],
        sites: [
          { id: 'site-297-1', code: '297-01', name: 'Main Campus', address: '1489 Florida Ave NE, Washington, DC 20002' }
        ]
      }
    ]
  },
  {
    id: 'lea-pcs-180',
    code: '180',
    name: 'Harmony DC PCS',
    schools: [
      {
        id: 'campus-245',
        code: '245',
        name: 'Harmony DC PCS - School of Excellence',
        gradeBand: 'PK–12',
        grades: ['Pre-K', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
        sites: [
          { id: 'site-245-1', code: '245-01', name: 'Main Campus', address: '4365 Georgia Ave NW, Washington, DC 20011' },
          { id: 'site-245-2', code: '245-02', name: 'North Building', address: '4478 14th St NW, Washington, DC 20009' },
          { id: 'site-245-3', code: '245-03', name: 'South Building', address: '4591 Good Hope Rd SE, Washington, DC 20020' }
        ]
      }
    ]
  },
  {
    id: 'lea-pcs-124',
    code: '124',
    name: 'Howard University Middle School of Mathematics and Science PCS',
    schools: [
      {
        id: 'campus-115',
        code: '115',
        name: 'Howard University Middle School of Mathematics and Science PCS',
        gradeBand: '6–8',
        grades: ['6', '7', '8'],
        sites: [
          { id: 'site-115-1', code: '115-01', name: 'Main Campus', address: '4355 Georgia Ave NW, Washington, DC 20011' },
          { id: 'site-115-2', code: '115-02', name: 'Annex', address: '4468 14th St NW, Washington, DC 20009' }
        ]
      }
    ]
  },
  {
    id: 'lea-pcs-126',
    code: '126',
    name: 'IDEA PCS',
    schools: [
      {
        id: 'campus-163',
        code: '163',
        name: 'IDEA PCS',
        gradeBand: 'PK–12',
        grades: ['Pre-K', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
        sites: [
          { id: 'site-163-1', code: '163-01', name: 'Main Campus', address: '1331 Kenilworth Ave NE, Washington, DC 20019' }
        ]
      }
    ]
  },
  {
    id: 'lea-pcs-173',
    code: '173',
    name: 'Ingenuity Prep PCS',
    schools: [
      {
        id: 'campus-200',
        code: '200',
        name: 'Ingenuity Prep PCS',
        gradeBand: 'PK–12',
        grades: ['Pre-K', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
        sites: [
          { id: 'site-200-1', code: '200-01', name: 'Main Campus', address: '2700 Georgia Ave NW, Washington, DC 20011' },
          { id: 'site-200-2', code: '200-02', name: 'Annex', address: '2813 14th St NW, Washington, DC 20009' }
        ]
      }
    ]
  },
  {
    id: 'lea-pcs-165',
    code: '165',
    name: 'Inspired Teaching Demonstration PCS',
    schools: [
      {
        id: 'campus-3064',
        code: '3064',
        name: 'Inspired Teaching Demonstration PCS',
        gradeBand: 'PK–12',
        grades: ['Pre-K', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
        sites: [
          { id: 'site-3064-1', code: '3064-01', name: 'Main Campus', address: '3068 Brentwood Rd NE, Washington, DC 20018' }
        ]
      }
    ]
  },
  {
    id: 'lea-pcs-186',
    code: '186',
    name: 'Kingsman Academy PCS',
    schools: [
      {
        id: 'campus-267',
        code: '267',
        name: 'Kingsman Academy PCS',
        gradeBand: 'PK–12',
        grades: ['Pre-K', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
        sites: [
          { id: 'site-267-1', code: '267-01', name: 'Main Campus', address: '379 Florida Ave NE, Washington, DC 20002' }
        ]
      }
    ]
  },
  {
    id: 'lea-kipp',
    code: '129',
    name: 'KIPP DC PCS',
    schools: [
      {
        id: 'campus-116',
        code: '116',
        name: 'KIPP DC - AIM Academy PCS',
        gradeBand: 'PK–12',
        grades: ['Pre-K', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
        sites: [
          { id: 'site-116-1', code: '116-01', name: 'Main Campus', address: '4392 Martin Luther King Jr Ave SE, Washington, DC 20020' }
        ]
      },
      {
        id: 'campus-236',
        code: '236',
        name: 'KIPP DC - Arts and Technology Academy PCS',
        gradeBand: 'PK–12',
        grades: ['Pre-K', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
        sites: [
          { id: 'site-236-1', code: '236-01', name: 'Main Campus', address: '4032 Martin Luther King Jr Ave SE, Washington, DC 20020' }
        ]
      },
      {
        id: 'campus-1123',
        code: '1123',
        name: 'KIPP DC - College Preparatory PCS',
        gradeBand: '9–12',
        grades: ['9', '10', '11', '12'],
        sites: [
          { id: 'site-1123-1', code: '1123-01', name: 'Main Campus', address: '3251 Kenilworth Ave NE, Washington, DC 20019' }
        ]
      },
      {
        id: 'campus-209',
        code: '209',
        name: 'KIPP DC - Connect Academy PCS',
        gradeBand: 'PK–12',
        grades: ['Pre-K', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
        sites: [
          { id: 'site-209-1', code: '209-01', name: 'Main Campus', address: '3033 Brentwood Rd NE, Washington, DC 20018' }
        ]
      },
      {
        id: 'campus-1122',
        code: '1122',
        name: 'KIPP DC - Discover Academy PCS',
        gradeBand: 'PK–12',
        grades: ['Pre-K', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
        sites: [
          { id: 'site-1122-1', code: '1122-01', name: 'Main Campus', address: '3214 Florida Ave NE, Washington, DC 20002' }
        ]
      },
      {
        id: 'campus-1129',
        code: '1129',
        name: 'KIPP DC - Grow Academy PCS',
        gradeBand: 'PK–12',
        grades: ['Pre-K', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
        sites: [
          { id: 'site-1129-1', code: '1129-01', name: 'Main Campus', address: '3473 Brentwood Rd NE, Washington, DC 20018' }
        ]
      },
      {
        id: 'campus-3071',
        code: '3071',
        name: 'KIPP DC - Heights Academy PCS',
        gradeBand: 'PK–12',
        grades: ['Pre-K', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
        sites: [
          { id: 'site-3071-1', code: '3071-01', name: 'Main Campus', address: '3327 Martin Luther King Jr Ave SE, Washington, DC 20020' }
        ]
      },
      {
        id: 'campus-1085',
        code: '1085',
        name: 'KIPP DC - Honor Academy PCS',
        gradeBand: 'PK–12',
        grades: ['Pre-K', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
        sites: [
          { id: 'site-1085-1', code: '1085-01', name: 'Main Campus', address: '1845 Georgia Ave NW, Washington, DC 20011' },
          { id: 'site-1085-2', code: '1085-02', name: 'North Building', address: '1958 14th St NW, Washington, DC 20009' },
          { id: 'site-1085-3', code: '1085-03', name: 'South Building', address: '2071 Good Hope Rd SE, Washington, DC 20020' }
        ]
      },
      {
        id: 'campus-1185',
        code: '1185',
        name: 'KIPP DC - Inspire Academy PCS',
        gradeBand: 'PK–12',
        grades: ['Pre-K', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
        sites: [
          { id: 'site-1185-1', code: '1185-01', name: 'Main Campus', address: '745 Georgia Ave NW, Washington, DC 20011' },
          { id: 'site-1185-2', code: '1185-02', name: 'Annex', address: '858 14th St NW, Washington, DC 20009' }
        ]
      },
      {
        id: 'campus-189',
        code: '189',
        name: 'KIPP DC - KEY Academy PCS',
        gradeBand: 'PK–12',
        grades: ['Pre-K', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
        sites: [
          { id: 'site-189-1', code: '189-01', name: 'Main Campus', address: '2293 Brentwood Rd NE, Washington, DC 20018' },
          { id: 'site-189-2', code: '189-02', name: 'North Building', address: '2406 Benning Rd NE, Washington, DC 20019' },
          { id: 'site-189-3', code: '189-03', name: 'South Building', address: '2519 Pennsylvania Ave SE, Washington, DC 20003' }
        ]
      },
      {
        id: 'campus-190',
        code: '190',
        name: 'KIPP DC - Lead Academy PCS',
        gradeBand: 'PK–12',
        grades: ['Pre-K', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
        sites: [
          { id: 'site-190-1', code: '190-01', name: 'Main Campus', address: '2330 Georgia Ave NW, Washington, DC 20011' },
          { id: 'site-190-2', code: '190-02', name: 'Annex', address: '2443 14th St NW, Washington, DC 20009' }
        ]
      },
      {
        id: 'campus-132',
        code: '132',
        name: 'KIPP DC - LEAP Academy PCS',
        gradeBand: 'PK–12',
        grades: ['Pre-K', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
        sites: [
          { id: 'site-132-1', code: '132-01', name: 'Main Campus', address: '184 Florida Ave NE, Washington, DC 20002' }
        ]
      },
      {
        id: 'campus-1086',
        code: '1086',
        name: 'KIPP DC - Legacy College Preparatory PCS',
        gradeBand: '9–12',
        grades: ['9', '10', '11', '12'],
        sites: [
          { id: 'site-1086-1', code: '1086-01', name: 'Main Campus', address: '1882 Martin Luther King Jr Ave SE, Washington, DC 20020' }
        ]
      },
      {
        id: 'campus-242',
        code: '242',
        name: 'KIPP DC - Northeast Academy PCS',
        gradeBand: 'PK–12',
        grades: ['Pre-K', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
        sites: [
          { id: 'site-242-1', code: '242-01', name: 'Main Campus', address: '4254 Florida Ave NE, Washington, DC 20002' }
        ]
      },
      {
        id: 'campus-1177',
        code: '1177',
        name: 'KIPP DC - Pride Academy PCS',
        gradeBand: 'PK–12',
        grades: ['Pre-K', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
        sites: [
          { id: 'site-1177-1', code: '1177-01', name: 'Main Campus', address: '449 Florida Ave NE, Washington, DC 20002' }
        ]
      },
      {
        id: 'campus-1121',
        code: '1121',
        name: 'KIPP DC - Promise Academy PCS',
        gradeBand: 'PK–12',
        grades: ['Pre-K', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
        sites: [
          { id: 'site-1121-1', code: '1121-01', name: 'Main Campus', address: '3177 Martin Luther King Jr Ave SE, Washington, DC 20020' }
        ]
      },
      {
        id: 'campus-237',
        code: '237',
        name: 'KIPP DC - Quest Academy PCS',
        gradeBand: 'PK–12',
        grades: ['Pre-K', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
        sites: [
          { id: 'site-237-1', code: '237-01', name: 'Main Campus', address: '4069 Florida Ave NE, Washington, DC 20002' }
        ]
      },
      {
        id: 'campus-214',
        code: '214',
        name: 'KIPP DC - Spring Academy PCS',
        gradeBand: 'PK–12',
        grades: ['Pre-K', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
        sites: [
          { id: 'site-214-1', code: '214-01', name: 'Main Campus', address: '3218 Brentwood Rd NE, Washington, DC 20018' }
        ]
      },
      {
        id: 'campus-243',
        code: '243',
        name: 'KIPP DC - Valor Academy PCS',
        gradeBand: 'PK–12',
        grades: ['Pre-K', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
        sites: [
          { id: 'site-243-1', code: '243-01', name: 'Main Campus', address: '4291 Kenilworth Ave NE, Washington, DC 20019' }
        ]
      },
      {
        id: 'campus-121',
        code: '121',
        name: 'KIPP DC - WILL Academy PCS',
        gradeBand: 'PK–12',
        grades: ['Pre-K', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
        sites: [
          { id: 'site-121-1', code: '121-01', name: 'Main Campus', address: '4577 Martin Luther King Jr Ave SE, Washington, DC 20020' }
        ]
      }
    ]
  },
  {
    id: 'lea-pcs-130',
    code: '130',
    name: 'Latin American Montessori Bilingual PCS',
    schools: [
      {
        id: 'campus-193',
        code: '193',
        name: 'Latin American Montessori Bilingual PCS',
        gradeBand: 'PK–6',
        grades: ['Pre-K', 'K', '1', '2', '3', '4', '5', '6'],
        sites: [
          { id: 'site-193-1', code: '193-01', name: 'Main Campus', address: '2441 Kenilworth Ave NE, Washington, DC 20019' }
        ]
      }
    ]
  },
  {
    id: 'lea-pcs-172',
    code: '172',
    name: 'LAYC Career Academy PCS',
    schools: [
      {
        id: 'campus-104',
        code: '104',
        name: 'LAYC Career Academy PCS',
        gradeBand: 'Adult',
        grades: ['Adult'],
        sites: [
          { id: 'site-104-1', code: '104-01', name: 'Main Campus', address: '3948 Brentwood Rd NE, Washington, DC 20018' }
        ]
      }
    ]
  },
  {
    id: 'lea-pcs-358',
    code: '358',
    name: 'LEARN DC PCS',
    schools: [
      {
        id: 'campus-1172',
        code: '1172',
        name: 'LEARN DC PCS',
        gradeBand: 'PK–12',
        grades: ['Pre-K', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
        sites: [
          { id: 'site-1172-1', code: '1172-01', name: 'Main Campus', address: '264 Florida Ave NE, Washington, DC 20002' }
        ]
      }
    ]
  },
  {
    id: 'lea-pcs-177',
    code: '177',
    name: 'Lee Montessori PCS',
    schools: [
      {
        id: 'campus-228',
        code: '228',
        name: 'Lee Montessori PCS - Brookland',
        gradeBand: 'PK–6',
        grades: ['Pre-K', 'K', '1', '2', '3', '4', '5', '6'],
        sites: [
          { id: 'site-228-1', code: '228-01', name: 'Main Campus', address: '3736 Kenilworth Ave NE, Washington, DC 20019' }
        ]
      },
      {
        id: 'campus-1141',
        code: '1141',
        name: 'Lee Montessori PCS - East End',
        gradeBand: 'PK–6',
        grades: ['Pre-K', 'K', '1', '2', '3', '4', '5', '6'],
        sites: [
          { id: 'site-1141-1', code: '1141-01', name: 'Main Campus', address: '3917 Martin Luther King Jr Ave SE, Washington, DC 20020' },
          { id: 'site-1141-2', code: '1141-02', name: 'North Building', address: '4030 Alabama Ave SE, Washington, DC 20032' },
          { id: 'site-1141-3', code: '1141-03', name: 'South Building', address: '4143 Nannie Helen Burroughs Ave NE, Washington, DC 20019' }
        ]
      }
    ]
  },
  {
    id: 'lea-pcs-132',
    code: '132',
    name: 'Mary McLeod Bethune Day Academy PCS',
    schools: [
      {
        id: 'campus-135',
        code: '135',
        name: 'Mary McLeod Bethune Day Academy PCS',
        gradeBand: 'PK–12',
        grades: ['Pre-K', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
        sites: [
          { id: 'site-135-1', code: '135-01', name: 'Main Campus', address: '295 Georgia Ave NW, Washington, DC 20011' },
          { id: 'site-135-2', code: '135-02', name: 'Annex', address: '408 14th St NW, Washington, DC 20009' }
        ]
      }
    ]
  },
  {
    id: 'lea-pcs-133',
    code: '133',
    name: 'Maya Angelou PCS',
    schools: [
      {
        id: 'campus-101',
        code: '101',
        name: 'Maya Angelou PCS - High School',
        gradeBand: '9–12',
        grades: ['9', '10', '11', '12'],
        sites: [
          { id: 'site-101-1', code: '101-01', name: 'Main Campus', address: '3837 Martin Luther King Jr Ave SE, Washington, DC 20020' }
        ]
      },
      {
        id: 'campus-137',
        code: '137',
        name: 'Maya Angelou PCS - Young Adult Learning Center',
        gradeBand: 'Adult',
        grades: ['Adult'],
        sites: [
          { id: 'site-137-1', code: '137-01', name: 'Main Campus', address: '369 Florida Ave NE, Washington, DC 20002' }
        ]
      }
    ]
  },
  {
    id: 'lea-pcs-135',
    code: '135',
    name: 'Meridian PCS',
    schools: [
      {
        id: 'campus-165',
        code: '165',
        name: 'Meridian PCS',
        gradeBand: 'PK–12',
        grades: ['Pre-K', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
        sites: [
          { id: 'site-165-1', code: '165-01', name: 'Main Campus', address: '1405 Georgia Ave NW, Washington, DC 20011' },
          { id: 'site-165-2', code: '165-02', name: 'Annex', address: '1518 14th St NW, Washington, DC 20009' }
        ]
      }
    ]
  },
  {
    id: 'lea-pcs-184',
    code: '184',
    name: 'Monument Academy PCS',
    schools: [
      {
        id: 'campus-260',
        code: '260',
        name: 'Monument Academy PCS',
        gradeBand: 'PK–12',
        grades: ['Pre-K', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
        sites: [
          { id: 'site-260-1', code: '260-01', name: 'Main Campus', address: '120 Georgia Ave NW, Washington, DC 20011' },
          { id: 'site-260-2', code: '260-02', name: 'Annex', address: '233 14th St NW, Washington, DC 20009' }
        ]
      }
    ]
  },
  {
    id: 'lea-pcs-171',
    code: '171',
    name: 'Mundo Verde Bilingual PCS',
    schools: [
      {
        id: 'campus-1088',
        code: '1088',
        name: 'Mundo Verde Bilingual PCS - Calle Ocho',
        gradeBand: 'PK–12',
        grades: ['Pre-K', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
        sites: [
          { id: 'site-1088-1', code: '1088-01', name: 'Main Campus', address: '1956 Kenilworth Ave NE, Washington, DC 20019' }
        ]
      },
      {
        id: 'campus-3065',
        code: '3065',
        name: 'Mundo Verde Bilingual PCS - J.F. Cook',
        gradeBand: 'PK–12',
        grades: ['Pre-K', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
        sites: [
          { id: 'site-3065-1', code: '3065-01', name: 'Main Campus', address: '3105 Georgia Ave NW, Washington, DC 20011' },
          { id: 'site-3065-2', code: '3065-02', name: 'Annex', address: '3218 14th St NW, Washington, DC 20009' }
        ]
      }
    ]
  },
  {
    id: 'lea-pcs-138',
    code: '138',
    name: 'Paul PCS',
    schools: [
      {
        id: 'campus-222',
        code: '222',
        name: 'Paul PCS - International High School',
        gradeBand: '9–12',
        grades: ['9', '10', '11', '12'],
        sites: [
          { id: 'site-222-1', code: '222-01', name: 'Main Campus', address: '3514 Florida Ave NE, Washington, DC 20002' }
        ]
      },
      {
        id: 'campus-170',
        code: '170',
        name: 'Paul PCS - Middle School',
        gradeBand: '6–8',
        grades: ['6', '7', '8'],
        sites: [
          { id: 'site-170-1', code: '170-01', name: 'Main Campus', address: '1590 Georgia Ave NW, Washington, DC 20011' },
          { id: 'site-170-2', code: '170-02', name: 'Annex', address: '1703 14th St NW, Washington, DC 20009' }
        ]
      }
    ]
  },
  {
    id: 'lea-pcs-125',
    code: '125',
    name: 'Perry Street Preparatory PCS',
    schools: [
      {
        id: 'campus-161',
        code: '161',
        name: 'Perry Street Preparatory PCS',
        gradeBand: 'PK–12',
        grades: ['Pre-K', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
        sites: [
          { id: 'site-161-1', code: '161-01', name: 'Main Campus', address: '1257 Martin Luther King Jr Ave SE, Washington, DC 20020' },
          { id: 'site-161-2', code: '161-02', name: 'North Building', address: '1370 Alabama Ave SE, Washington, DC 20032' },
          { id: 'site-161-3', code: '161-03', name: 'South Building', address: '1483 Nannie Helen Burroughs Ave NE, Washington, DC 20019' }
        ]
      }
    ]
  },
  {
    id: 'lea-pcs-167',
    code: '167',
    name: 'Richard Wright PCS for Journalism and Media Arts',
    schools: [
      {
        id: 'campus-3067',
        code: '3067',
        name: 'Richard Wright PCS for Journalism and Media Arts',
        gradeBand: 'PK–12',
        grades: ['Pre-K', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
        sites: [
          { id: 'site-3067-1', code: '3067-01', name: 'Main Campus', address: '3179 Florida Ave NE, Washington, DC 20002' }
        ]
      }
    ]
  },
  {
    id: 'lea-pcs-191',
    code: '191',
    name: 'Rocketship Education DC PCS',
    schools: [
      {
        id: 'campus-1150',
        code: '1150',
        name: 'Rocketship PCS - Infinity Community Prep',
        gradeBand: 'PK–5',
        grades: ['Pre-K', 'K', '1', '2', '3', '4', '5'],
        sites: [
          { id: 'site-1150-1', code: '1150-01', name: 'Main Campus', address: '4250 Georgia Ave NW, Washington, DC 20011' },
          { id: 'site-1150-2', code: '1150-02', name: 'Annex', address: '4363 14th St NW, Washington, DC 20009' }
        ]
      },
      {
        id: 'campus-1016',
        code: '1016',
        name: 'Rocketship PCS - Legacy Prep',
        gradeBand: 'PK–5',
        grades: ['Pre-K', 'K', '1', '2', '3', '4', '5'],
        sites: [
          { id: 'site-1016-1', code: '1016-01', name: 'Main Campus', address: '4092 Martin Luther King Jr Ave SE, Washington, DC 20020' }
        ]
      },
      {
        id: 'campus-286',
        code: '286',
        name: 'Rocketship PCS - Rise Academy',
        gradeBand: 'PK–5',
        grades: ['Pre-K', 'K', '1', '2', '3', '4', '5'],
        sites: [
          { id: 'site-286-1', code: '286-01', name: 'Main Campus', address: '1082 Martin Luther King Jr Ave SE, Washington, DC 20020' }
        ]
      }
    ]
  },
  {
    id: 'lea-pcs-140',
    code: '140',
    name: 'Roots PCS',
    schools: [
      {
        id: 'campus-173',
        code: '173',
        name: 'Roots PCS',
        gradeBand: 'PK–12',
        grades: ['Pre-K', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
        sites: [
          { id: 'site-173-1', code: '173-01', name: 'Main Campus', address: '1701 Kenilworth Ave NE, Washington, DC 20019' }
        ]
      }
    ]
  },
  {
    id: 'lea-seed',
    code: '142',
    name: 'SEED PCS',
    schools: [
      {
        id: 'campus-174',
        code: '174',
        name: 'The SEED PCS of Washington DC',
        gradeBand: 'PK–12',
        grades: ['Pre-K', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
        sites: [
          { id: 'site-174-1', code: '174-01', name: 'Main Campus', address: '1738 Brentwood Rd NE, Washington, DC 20018' }
        ]
      }
    ]
  },
  {
    id: 'lea-pcs-174',
    code: '174',
    name: 'Sela PCS',
    schools: [
      {
        id: 'campus-197',
        code: '197',
        name: 'Sela PCS',
        gradeBand: 'PK–12',
        grades: ['Pre-K', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
        sites: [
          { id: 'site-197-1', code: '197-01', name: 'Main Campus', address: '2589 Florida Ave NE, Washington, DC 20002' }
        ]
      }
    ]
  },
  {
    id: 'lea-pcs-166',
    code: '166',
    name: 'Shining Stars Montessori Academy PCS',
    schools: [
      {
        id: 'campus-3066',
        code: '3066',
        name: 'Shining Stars Montessori Academy PCS',
        gradeBand: 'PK–6',
        grades: ['Pre-K', 'K', '1', '2', '3', '4', '5', '6'],
        sites: [
          { id: 'site-3066-1', code: '3066-01', name: 'Main Campus', address: '3142 Martin Luther King Jr Ave SE, Washington, DC 20020' },
          { id: 'site-3066-2', code: '3066-02', name: 'North Building', address: '3255 Alabama Ave SE, Washington, DC 20032' },
          { id: 'site-3066-3', code: '3066-03', name: 'South Building', address: '3368 Nannie Helen Burroughs Ave NE, Washington, DC 20019' }
        ]
      }
    ]
  },
  {
    id: 'lea-pcs-350',
    code: '350',
    name: 'Social Justice PCS',
    schools: [
      {
        id: 'campus-1148',
        code: '1148',
        name: 'Social Justice PCS',
        gradeBand: 'PK–12',
        grades: ['Pre-K', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
        sites: [
          { id: 'site-1148-1', code: '1148-01', name: 'Main Campus', address: '4176 Kenilworth Ave NE, Washington, DC 20019' },
          { id: 'site-1148-2', code: '1148-02', name: 'North Building', address: '4289 Kansas Ave NW, Washington, DC 20011' },
          { id: 'site-1148-3', code: '1148-03', name: 'South Building', address: '4402 Minnesota Ave SE, Washington, DC 20019' }
        ]
      }
    ]
  },
  {
    id: 'lea-pcs-143',
    code: '143',
    name: 'St. Coletta Special Education PCS',
    schools: [
      {
        id: 'campus-1047',
        code: '1047',
        name: 'St. Coletta Special Education PCS',
        gradeBand: 'PK–12',
        grades: ['Pre-K', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
        sites: [
          { id: 'site-1047-1', code: '1047-01', name: 'Main Campus', address: '439 Florida Ave NE, Washington, DC 20002' }
        ]
      }
    ]
  },
  {
    id: 'lea-pcs-314',
    code: '314',
    name: 'Statesmen College Preparatory Academy for Boys PCS',
    schools: [
      {
        id: 'campus-1037',
        code: '1037',
        name: 'Statesmen College Preparatory Academy for Boys PCS',
        gradeBand: 'PK–12',
        grades: ['Pre-K', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
        sites: [
          { id: 'site-1037-1', code: '1037-01', name: 'Main Campus', address: '4869 Florida Ave NE, Washington, DC 20002' }
        ]
      }
    ]
  },
  {
    id: 'lea-pcs-188',
    code: '188',
    name: 'The Children\'s Guild DC PCS',
    schools: [
      {
        id: 'campus-255',
        code: '255',
        name: 'The Children\'s Guild DC PCS',
        gradeBand: 'PK–12',
        grades: ['Pre-K', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
        sites: [
          { id: 'site-255-1', code: '255-01', name: 'Main Campus', address: '4735 Georgia Ave NW, Washington, DC 20011' },
          { id: 'site-255-2', code: '255-02', name: 'Annex', address: '4848 14th St NW, Washington, DC 20009' }
        ]
      }
    ]
  },
  {
    id: 'lea-pcs-303',
    code: '303',
    name: 'The Family Place PCS',
    schools: [
      {
        id: 'campus-1036',
        code: '1036',
        name: 'The Family Place PCS',
        gradeBand: 'PK–12',
        grades: ['Pre-K', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
        sites: [
          { id: 'site-1036-1', code: '1036-01', name: 'Main Campus', address: '4832 Martin Luther King Jr Ave SE, Washington, DC 20020' },
          { id: 'site-1036-2', code: '1036-02', name: 'North Building', address: '145 Alabama Ave SE, Washington, DC 20032' },
          { id: 'site-1036-3', code: '1036-03', name: 'South Building', address: '258 Nannie Helen Burroughs Ave NE, Washington, DC 20019' }
        ]
      }
    ]
  },
  {
    id: 'lea-pcs-145',
    code: '145',
    name: 'The Next Step/El Proximo Paso PCS',
    schools: [
      {
        id: 'campus-168',
        code: '168',
        name: 'The Next Step/El Proximo Paso PCS',
        gradeBand: 'PK–12',
        grades: ['Pre-K', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
        sites: [
          { id: 'site-168-1', code: '168-01', name: 'Main Campus', address: '1516 Kenilworth Ave NE, Washington, DC 20019' },
          { id: 'site-168-2', code: '168-02', name: 'North Building', address: '1629 Kansas Ave NW, Washington, DC 20011' },
          { id: 'site-168-3', code: '168-03', name: 'South Building', address: '1742 Minnesota Ave SE, Washington, DC 20019' }
        ]
      }
    ]
  },
  {
    id: 'lea-pcs-323',
    code: '323',
    name: 'The Sojourner Truth School PCS',
    schools: [
      {
        id: 'campus-1144',
        code: '1144',
        name: 'The Sojourner Truth School PCS',
        gradeBand: 'PK–12',
        grades: ['Pre-K', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
        sites: [
          { id: 'site-1144-1', code: '1144-01', name: 'Main Campus', address: '4028 Brentwood Rd NE, Washington, DC 20018' }
        ]
      }
    ]
  },
  {
    id: 'lea-pcs-146',
    code: '146',
    name: 'Thurgood Marshall Academy PCS',
    schools: [
      {
        id: 'campus-191',
        code: '191',
        name: 'Thurgood Marshall Academy PCS',
        gradeBand: 'PK–12',
        grades: ['Pre-K', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
        sites: [
          { id: 'site-191-1', code: '191-01', name: 'Main Campus', address: '2367 Martin Luther King Jr Ave SE, Washington, DC 20020' }
        ]
      }
    ]
  },
  {
    id: 'lea-pcs-149',
    code: '149',
    name: 'Two Rivers PCS',
    schools: [
      {
        id: 'campus-198',
        code: '198',
        name: 'Two Rivers PCS - 4th Street',
        gradeBand: 'PK–12',
        grades: ['Pre-K', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
        sites: [
          { id: 'site-198-1', code: '198-01', name: 'Main Campus', address: '2626 Kenilworth Ave NE, Washington, DC 20019' }
        ]
      },
      {
        id: 'campus-270',
        code: '270',
        name: 'Two Rivers PCS - Young Elementary School',
        gradeBand: 'PK–5',
        grades: ['Pre-K', 'K', '1', '2', '3', '4', '5'],
        sites: [
          { id: 'site-270-1', code: '270-01', name: 'Main Campus', address: '490 Georgia Ave NW, Washington, DC 20011' },
          { id: 'site-270-2', code: '270-02', name: 'Annex', address: '603 14th St NW, Washington, DC 20009' }
        ]
      },
      {
        id: 'campus-1152',
        code: '1152',
        name: 'Two Rivers PCS - Young Middle School',
        gradeBand: '6–8',
        grades: ['6', '7', '8'],
        sites: [
          { id: 'site-1152-1', code: '1152-01', name: 'Main Campus', address: '4324 Florida Ave NE, Washington, DC 20002' }
        ]
      }
    ]
  },
  {
    id: 'lea-pcs-185',
    code: '185',
    name: 'Washington Global PCS',
    schools: [
      {
        id: 'campus-263',
        code: '263',
        name: 'Washington Global PCS',
        gradeBand: 'PK–12',
        grades: ['Pre-K', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
        sites: [
          { id: 'site-263-1', code: '263-01', name: 'Main Campus', address: '231 Kenilworth Ave NE, Washington, DC 20019' }
        ]
      }
    ]
  },
  {
    id: 'lea-pcs-151',
    code: '151',
    name: 'Washington Latin PCS',
    schools: [
      {
        id: 'campus-125',
        code: '125',
        name: 'Washington Latin PCS - Middle School',
        gradeBand: '6–8',
        grades: ['6', '7', '8'],
        sites: [
          { id: 'site-125-1', code: '125-01', name: 'Main Campus', address: '4725 Georgia Ave NW, Washington, DC 20011' },
          { id: 'site-125-2', code: '125-02', name: 'Annex', address: '4838 14th St NW, Washington, DC 20009' }
        ]
      },
      {
        id: 'campus-3162',
        code: '3162',
        name: 'Washington Latin PCS - The Anna Julia Cooper Campus High School',
        gradeBand: '9–12',
        grades: ['9', '10', '11', '12'],
        sites: [
          { id: 'site-3162-1', code: '3162-01', name: 'Main Campus', address: '1894 Florida Ave NE, Washington, DC 20002' }
        ]
      },
      {
        id: 'campus-1292',
        code: '1292',
        name: 'Washington Latin PCS - The Anna Julia Cooper Campus Middle School',
        gradeBand: '6–8',
        grades: ['6', '7', '8'],
        sites: [
          { id: 'site-1292-1', code: '1292-01', name: 'Main Campus', address: '4704 Florida Ave NE, Washington, DC 20002' }
        ]
      },
      {
        id: 'campus-1118',
        code: '1118',
        name: 'Washington Latin PCS - Upper School',
        gradeBand: '9–12',
        grades: ['9', '10', '11', '12'],
        sites: [
          { id: 'site-1118-1', code: '1118-01', name: 'Main Campus', address: '3066 Kenilworth Ave NE, Washington, DC 20019' }
        ]
      }
    ]
  },
  {
    id: 'lea-pcs-194',
    code: '194',
    name: 'Washington Leadership Academy PCS',
    schools: [
      {
        id: 'campus-283',
        code: '283',
        name: 'Washington Leadership Academy PCS',
        gradeBand: 'PK–12',
        grades: ['Pre-K', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
        sites: [
          { id: 'site-283-1', code: '283-01', name: 'Main Campus', address: '971 Kenilworth Ave NE, Washington, DC 20019' }
        ]
      }
    ]
  },
  {
    id: 'lea-pcs-160',
    code: '160',
    name: 'Washington Yu Ying PCS',
    schools: [
      {
        id: 'campus-1117',
        code: '1117',
        name: 'Washington Yu Ying PCS',
        gradeBand: 'PK–12',
        grades: ['Pre-K', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
        sites: [
          { id: 'site-1117-1', code: '1117-01', name: 'Main Campus', address: '3029 Florida Ave NE, Washington, DC 20002' }
        ]
      }
    ]
  },
  {
    id: 'lea-pcs-131',
    code: '131',
    name: 'YouthBuild DC PCS',
    schools: [
      {
        id: 'campus-128',
        code: '128',
        name: 'YouthBuild DC PCS',
        gradeBand: 'Adult',
        grades: ['Adult'],
        sites: [
          { id: 'site-128-1', code: '128-01', name: 'Main Campus', address: '4836 Kenilworth Ave NE, Washington, DC 20019' }
        ]
      }
    ]
  }
];
