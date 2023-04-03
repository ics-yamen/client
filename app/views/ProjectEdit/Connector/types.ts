import {
    PurgeNull,
} from '@togglecorp/toggle-form';

import {
    UnifiedConnectorWithSourceInputType,
    ConnectorSourceGqInputType,
} from '#generated/types';
import {
    DeepReplace,
    DeepMandatory,
} from '#utils/types';

export interface Country {
    key: string;
    label: string;
}
// TODO: Fetch this later from server
export const reliefWebCountryList: Country[] = [
    { key: 'AFG', label: 'Afghanistan' },
    { key: 'ALB', label: 'Albania' },
    { key: 'DZA', label: 'Algeria' },
    { key: 'AGO', label: 'Angola' },
    { key: 'ATA', label: 'Antarctica' },
    { key: 'ARG', label: 'Argentina' },
    { key: 'ARM', label: 'Armenia' },
    { key: 'AUS', label: 'Australia' },
    { key: 'AUT', label: 'Austria' },
    { key: 'AZE', label: 'Azerbaijan' },
    { key: 'BGD', label: 'Bangladesh' },
    { key: 'BLR', label: 'Belarus' },
    { key: 'BEL', label: 'Belgium' },
    { key: 'BLZ', label: 'Belize' },
    { key: 'BEN', label: 'Benin' },
    { key: 'BTN', label: 'Bhutan' },
    { key: 'BOL', label: 'Bolivia' },
    { key: 'BIH', label: 'Bosnia and Herzegovina' },
    { key: 'BWA', label: 'Botswana' },
    { key: 'PNG', label: 'Bougainville' },
    { key: 'BRA', label: 'Brazil' },
    { key: 'BRN', label: 'Brunei' },
    { key: 'BGR', label: 'Bulgaria' },
    { key: 'BFA', label: 'Burkina Faso' },
    { key: 'BDI', label: 'Burundi' },
    { key: 'KHM', label: 'Cambodia' },
    { key: 'CMR', label: 'Cameroon' },
    { key: 'CAN', label: 'Canada' },
    { key: 'CAF', label: 'Central African Republic' },
    { key: 'TCD', label: 'Chad' },
    { key: 'CHL', label: 'Chile' },
    { key: 'CHN', label: 'China' },
    { key: 'COL', label: 'Colombia' },
    { key: 'CRI', label: 'Costa Rica' },
    { key: 'HRV', label: 'Croatia' },
    { key: 'CUB', label: 'Cuba' },
    { key: 'CYP', label: 'Cyprus' },
    { key: 'CZE', label: 'Czech Republic' },
    { key: 'COD', label: 'Democratic Republic of the Congo' },
    { key: 'DNK', label: 'Denmark' },
    { key: 'DJI', label: 'Djibouti' },
    { key: 'DOM', label: 'Dominican Republic' },
    { key: 'TLS', label: 'East Timor' },
    { key: 'ECU', label: 'Ecuador' },
    { key: 'EGY', label: 'Egypt' },
    { key: 'SLV', label: 'El Salvador' },
    { key: 'GNQ', label: 'Equatorial Guinea' },
    { key: 'ERI', label: 'Eritrea' },
    { key: 'EST', label: 'Estonia' },
    { key: 'ETH', label: 'Ethiopia' },
    { key: 'FLK', label: 'Falkland Islands' },
    { key: 'FJI', label: 'Fiji' },
    { key: 'FIN', label: 'Finland' },
    { key: 'FRA', label: 'France' },
    { key: 'ATF', label: 'French Southern and Antarctic Lands' },
    { key: 'GAB', label: 'Gabon' },
    { key: 'GMB', label: 'Gambia' },
    { key: 'GEO', label: 'Georgia' },
    { key: 'DEU', label: 'Germany' },
    { key: 'GHA', label: 'Ghana' },
    { key: 'GRC', label: 'Greece' },
    { key: 'GRL', label: 'Greenland' },
    { key: 'GTM', label: 'Guatemala' },
    { key: 'GNB', label: 'Guinea Bissau' },
    { key: 'GIN', label: 'Guinea' },
    { key: 'GUY', label: 'Guyana' },
    { key: 'HTI', label: 'Haiti' },
    { key: 'HND', label: 'Honduras' },
    { key: 'HUN', label: 'Hungary' },
    { key: 'ISL', label: 'Iceland' },
    { key: 'IND', label: 'India' },
    { key: 'IDN', label: 'Indonesia' },
    { key: 'IRN', label: 'Iran' },
    { key: 'IRQ', label: 'Iraq' },
    { key: 'IRL', label: 'Ireland' },
    { key: 'ISR', label: 'Israel' },
    { key: 'ITA', label: 'Italy' },
    { key: 'CIV', label: 'Ivory Coast' },
    { key: 'JAM', label: 'Jamaica' },
    { key: 'JPN', label: 'Japan' },
    { key: 'JOR', label: 'Jordan' },
    { key: 'KAZ', label: 'Kazakhstan' },
    { key: 'KEN', label: 'Kenya' },
    { key: 'KOS', label: 'Kosovo' },
    { key: 'KWT', label: 'Kuwait' },
    { key: 'KGZ', label: 'Kyrgyzstan' },
    { key: 'LAO', label: 'Laos' },
    { key: 'LVA', label: 'Latvia' },
    { key: 'LBN', label: 'Lebanon' },
    { key: 'LSO', label: 'Lesotho' },
    { key: 'LBR', label: 'Liberia' },
    { key: 'LBY', label: 'Libya' },
    { key: 'LTU', label: 'Lithuania' },
    { key: 'LUX', label: 'Luxembourg' },
    { key: 'MKD', label: 'Macedonia' },
    { key: 'MDG', label: 'Madagascar' },
    { key: 'MWI', label: 'Malawi' },
    { key: 'MYS', label: 'Malaysia' },
    { key: 'MLI', label: 'Mali' },
    { key: 'MRT', label: 'Mauritania' },
    { key: 'MEX', label: 'Mexico' },
    { key: 'MDA', label: 'Moldova' },
    { key: 'MNG', label: 'Mongolia' },
    { key: 'MNE', label: 'Montenegro' },
    { key: 'MOZ', label: 'Mozambique' },
    { key: 'MMR', label: 'Myanmar' },
    { key: 'NAM', label: 'Namibia' },
    { key: 'NPL', label: 'Nepal' },
    { key: 'NLD', label: 'Netherlands' },
    { key: 'NCL', label: 'New Caledonia' },
    { key: 'NZL', label: 'New Zealand' },
    { key: 'NIC', label: 'Nicaragua' },
    { key: 'NER', label: 'Niger' },
    { key: 'NGA', label: 'Nigeria' },
    { key: 'PRK', label: 'North Korea' },
    { key: 'CYN', label: 'Northern Cyprus' },
    { key: 'OMN', label: 'Oman' },
    { key: 'PAK', label: 'Pakistan' },
    { key: 'PAN', label: 'Panama' },
    { key: 'PRY', label: 'Paraguay' },
    { key: 'PER', label: 'Peru' },
    { key: 'PHL', label: 'Philippines' },
    { key: 'POL', label: 'Poland' },
    { key: 'PRT', label: 'Portugal' },
    { key: 'PRI', label: 'Puerto Rico' },
    { key: 'QAT', label: 'Qatar' },
    { key: 'COG', label: 'Republic of the Congo' },
    { key: 'ROU', label: 'Romania' },
    { key: 'RUS', label: 'Russia' },
    { key: 'RWA', label: 'Rwanda' },
    { key: 'SAU', label: 'Saudi Arabia' },
    { key: 'GBR', label: 'Scotland' },
    { key: 'SEN', label: 'Senegal' },
    { key: 'SRB', label: 'Serbia' },
    { key: 'SLE', label: 'Sierra Leone' },
    { key: 'SVK', label: 'Slovakia' },
    { key: 'SVN', label: 'Slovenia' },
    { key: 'SLB', label: 'Solomon Islands' },
    { key: 'SOM', label: 'Somalia' },
    { key: 'SOL', label: 'Somaliland' },
    { key: 'ZAF', label: 'South Africa' },
    { key: 'KOR', label: 'South Korea' },
    { key: 'SDS', label: 'South Sudan' },
    { key: 'ESP', label: 'Spain' },
    { key: 'LKA', label: 'Sri Lanka' },
    { key: 'SDN', label: 'Sudan' },
    { key: 'SUR', label: 'Suriname' },
    { key: 'NOR', label: 'Svalbard' },
    { key: 'SWZ', label: 'Swaziland' },
    { key: 'SWE', label: 'Sweden' },
    { key: 'CHE', label: 'Switzerland' },
    { key: 'SYR', label: 'Syria' },
    { key: 'TWN', label: 'Taiwan' },
    { key: 'TJK', label: 'Tajikistan' },
    { key: 'TZA', label: 'Tanzania' },
    { key: 'THA', label: 'Thailand' },
    { key: 'BHS', label: 'The Bahamas' },
    { key: 'TGO', label: 'Togo' },
    { key: 'TTO', label: 'Trinidad and Tobago' },
    { key: 'TUN', label: 'Tunisia' },
    { key: 'TUR', label: 'Turkey' },
    { key: 'TKM', label: 'Turkmenistan' },
    { key: 'UGA', label: 'Uganda' },
    { key: 'UKR', label: 'Ukraine' },
    { key: 'ARE', label: 'United Arab Emirates' },
    { key: 'USA', label: 'United States of America' },
    { key: 'URY', label: 'Uruguay' },
    { key: 'UZB', label: 'Uzbekistan' },
    { key: 'VUT', label: 'Vanuatu' },
    { key: 'VEN', label: 'Venezuela' },
    { key: 'VNM', label: 'Vietnam' },
    { key: 'PSX', label: 'West Bank' },
    { key: 'SAH', label: 'Western Sahara' },
    { key: 'MAR', label: 'Western Sahara' },
    { key: 'YEM', label: 'Yemen' },
    { key: 'ZMB', label: 'Zambia' },
    { key: 'ZWE', label: 'Zimbabwe' },
];

export const unhcrCountryList: Country[] = [
    { label: 'All', key: '' },
    { label: 'Afghanistan', key: '575' },
    { label: 'Albania', key: '576' },
    { label: 'Algeria', key: '769' },
    { label: 'Andorra', key: '577' },
    { label: 'Angola', key: '578' },
    { label: 'Antigua and Barbuda', key: '579' },
    { label: 'Argentina', key: '580' },
    { label: 'Armenia', key: '581' },
    { label: 'Aruba', key: '11773' },
    { label: 'Australia', key: '582' },
    { label: 'Austria', key: '583' },
    { label: 'Azerbaijan', key: '584' },
    { label: 'Bahamas', key: '592' },
    { label: 'Bahrain', key: '585' },
    { label: 'Bangladesh', key: '591' },
    { label: 'Barbados', key: '586' },
    { label: 'Belarus', key: '595' },
    { label: 'Belgium', key: '588' },
    { label: 'Belize', key: '602' },
    { label: 'Benin', key: '589' },
    { label: 'Bhutan', key: '593' },
    { label: 'Bolivia (Plurinational State of)', key: '596' },
    { label: 'Bosnia and Herzegovina', key: '600' },
    { label: 'Botswana', key: '597' },
    { label: 'Brazil', key: '598' },
    { label: 'Brunei Darussalam', key: '599' },
    { label: 'Bulgaria', key: '601' },
    { label: 'Burkina Faso', key: '594' },
    { label: 'Burundi', key: '587' },
    { label: 'Cabo Verde', key: '615' },
    { label: 'Cambodia', key: '603' },
    { label: 'Cameroon', key: '349' },
    { label: 'Canada', key: '604' },
    { label: 'Central African Republic', key: '399' },
    { label: 'Chad', key: '410' },
    { label: 'Chile', key: '607' },
    { label: 'China', key: '606' },
    { label: 'Colombia', key: '612' },
    { label: 'Comoros', key: '610' },
    { label: 'Costa Rica', key: '613' },
    { label: 'Cote d\'Ivoire', key: '509' },
    { label: 'Croatia', key: '648' },
    { label: 'Cuba', key: '614' },
    { label: 'Curaçao', key: '11774' },
    { label: 'Cyprus', key: '616' },
    { label: 'Czech Republic', key: '617' },
    { label: 'Democratic People\'s Republic of Korea', key: '663' },
    { label: 'Democratic Republic of the Congo', key: '486' },
    { label: 'Denmark', key: '618' },
    { label: 'Djibouti', key: '151' },
    { label: 'Dominica', key: '619' },
    { label: 'Dominican Republic', key: '620' },
    { label: 'Ecuador', key: '621' },
    { label: 'Egypt', key: '1' },
    { label: 'El Salvador', key: '720' },
    { label: 'Equatorial Guinea', key: '622' },
    { label: 'Eritrea', key: '157' },
    { label: 'Estonia', key: '623' },
    { label: 'Ethiopia', key: '160' },
    { label: 'Fiji', key: '625' },
    { label: 'Finland', key: '626' },
    { label: 'France', key: '629' },
    { label: 'Gabon', key: '632' },
    { label: 'Gambia', key: '633' },
    { label: 'Georgia', key: '635' },
    { label: 'Germany', key: '636' },
    { label: 'Ghana', key: '637' },
    { label: 'Greece', key: '640' },
    { label: 'Grenada', key: '641' },
    { label: 'Guatemala', key: '642' },
    { label: 'Guinea', key: '643' },
    { label: 'Guinea-Bissau', key: '639' },
    { label: 'Guyana', key: '644' },
    { label: 'Haiti', key: '645' },
    { label: 'Holy See', key: '756' },
    { label: 'Honduras', key: '647' },
    { label: 'Hungary', key: '649' },
    { label: 'Iceland', key: '650' },
    { label: 'India', key: '651' },
    { label: 'Indonesia', key: '652' },
    { label: 'Iran (Islamic Republic of)', key: '654' },
    { label: 'Iraq', key: '5' },
    { label: 'Ireland', key: '653' },
    { label: 'Israel', key: '655' },
    { label: 'Italy', key: '656' },
    { label: 'Jamaica', key: '657' },
    { label: 'Japan', key: '658' },
    { label: 'Jordan', key: '36' },
    { label: 'Kazakhstan', key: '659' },
    { label: 'Kenya', key: '178' },
    { label: 'Kiribati', key: '661' },
    { label: 'Kuwait', key: '664' },
    { label: 'Kyrgyzstan', key: '660' },
    { label: 'Lao People\'s Democratic Republic', key: '665' },
    { label: 'Latvia', key: '673' },
    { label: 'Lebanon', key: '71' },
    { label: 'Lesotho', key: '668' },
    { label: 'Liberia', key: '535' },
    { label: 'Libya', key: '666' },
    { label: 'Liechtenstein', key: '669' },
    { label: 'Lithuania', key: '671' },
    { label: 'Luxembourg', key: '672' },
    { label: 'Madagascar', key: '675' },
    { label: 'Malawi', key: '686' },
    { label: 'Malaysia', key: '685' },
    { label: 'Maldives', key: '681' },
    { label: 'Mali', key: '684' },
    { label: 'Malta', key: '690' },
    { label: 'Marshall Islands', key: '683' },
    { label: 'Mauritania', key: '677' },
    { label: 'Mauritius', key: '692' },
    { label: 'Mexico', key: '682' },
    { label: 'Micronesia (Federated States of)', key: '631' },
    { label: 'Monaco', key: '679' },
    { label: 'Mongolia', key: '687' },
    { label: 'Montenegro', key: '691' },
    { label: 'Morocco', key: '688' },
    { label: 'Mozambique', key: '689' },
    { label: 'Myanmar', key: '693' },
    { label: 'Namibia', key: '694' },
    { label: 'Nauru', key: '702' },
    { label: 'Nepal', key: '695' },
    { label: 'Netherlands', key: '696' },
    { label: 'New Zealand', key: '703' },
    { label: 'Nicaragua', key: '698' },
    { label: 'Niger', key: '697' },
    { label: 'Nigeria', key: '699' },
    { label: 'Norway', key: '701' },
    { label: 'Oman', key: '704' },
    { label: 'Other (North Africa)', key: '10006' },
    { label: 'Other (Sub-Saharan Africa)', key: '10004' },
    { label: 'Pakistan', key: '705' },
    { label: 'Palau', key: '710' },
    { label: 'Panama', key: '706' },
    { label: 'Papua New Guinea', key: '711' },
    { label: 'Paraguay', key: '707' },
    { label: 'Peru', key: '708' },
    { label: 'Philippines', key: '709' },
    { label: 'Poland', key: '712' },
    { label: 'Portugal', key: '713' },
    { label: 'Qatar', key: '715' },
    { label: 'Republic of Korea', key: '662' },
    { label: 'Republic of Moldova', key: '680' },
    { label: 'Republic of the Congo', key: '476' },
    { label: 'Romania', key: '716' },
    { label: 'Russian Federation', key: '718' },
    { label: 'Rwanda', key: '719' },
    { label: 'Saint Kitts and Nevis', key: '731' },
    { label: 'Saint Lucia', key: '667' },
    { label: 'Saint Vincent and the Grenadines', key: '757' },
    { label: 'Samoa', key: '759' },
    { label: 'San Marino', key: '727' },
    { label: 'Sao Tome and Principe', key: '732' },
    { label: 'Saudi Arabia', key: '721' },
    { label: 'Senegal', key: '723' },
    { label: 'Serbia', key: '722' },
    { label: 'Seychelles', key: '724' },
    { label: 'Sierra Leone', key: '726' },
    { label: 'Singapore', key: '725' },
    { label: 'Slovakia', key: '734' },
    { label: 'Slovenia', key: '735' },
    { label: 'Solomon Islands', key: '728' },
    { label: 'Somalia', key: '192' },
    { label: 'South Africa', key: '717' },
    { label: 'South Sudan', key: '259' },
    { label: 'Spain', key: '729' },
    { label: 'Sri Lanka', key: '670' },
    { label: 'Sudan', key: '295' },
    { label: 'Suriname', key: '733' },
    { label: 'Swaziland', key: '736' },
    { label: 'Sweden', key: '737' },
    { label: 'Switzerland', key: '738' },
    { label: 'Syrian Arab Republic', key: '112' },
    { label: 'Tajikistan', key: '742' },
    { label: 'Tanzania (United Republic of)', key: '217' },
    { label: 'Thailand', key: '741' },
    { label: 'The former Yugoslav Republic of Macedonia', key: '678' },
    { label: 'Timor-Leste', key: '744' },
    { label: 'Togo', key: '745' },
    { label: 'Tonga', key: '746' },
    { label: 'Trinidad and Tobago', key: '747' },
    { label: 'Tunisia', key: '748' },
    { label: 'Turkey', key: '113' },
    { label: 'Turkmenistan', key: '743' },
    { label: 'Tuvalu', key: '749' },
    { label: 'Uganda', key: '220' },
    { label: 'Ukraine', key: '751' },
    { label: 'United Arab Emirates', key: '750' },
    { label: 'United Kingdom', key: '634' },
    { label: 'United States of America', key: '753' },
    { label: 'Uruguay', key: '752' },
    { label: 'Uzbekistan', key: '754' },
    { label: 'Vanuatu', key: '755' },
    { label: 'Venezuela', key: '758' },
    { label: 'Viet Nam', key: '730' },
    { label: 'Western Sahara', key: '760' },
    { label: 'Yemen', key: '225' },
    { label: 'Zambia', key: '761' },
    { label: 'Zimbabwe', key: '762' },
];

export const humanitarianResponseCountryList: Country[] = [
    { key: 'afghanistan', label: 'Afghanistan' },
    { key: 'albania', label: 'Albania' },
    { key: 'angola', label: 'Angola' },
    { key: 'anguilla', label: 'Anguilla' },
    { key: 'antigua-and-barbuda', label: 'Antigua and Barbuda' },
    { key: 'argentina', label: 'Argentina' },
    { key: 'austria', label: 'Austria' },
    { key: 'bahamas', label: 'Bahamas' },
    { key: 'bangladesh', label: 'Bangladesh' },
    { key: 'barbados', label: 'Barbados' },
    { key: 'benin', label: 'Benin' },
    { key: 'bolivia-plurinational-state', label: 'Bolivia, Plurinational State of' },
    { key: 'bonaire-sint-eustatius-and-saba', label: 'Bonaire, Sint Eustatius and Saba' },
    { key: 'botswana', label: 'Botswana' },
    { key: 'brazil', label: 'Brazil' },
    { key: 'burkina-faso', label: 'Burkina Faso' },
    { key: 'burundi', label: 'Burundi' },
    { key: 'cape-verde', label: 'Cabo Verde' },
    { key: 'cambodia', label: 'Cambodia' },
    { key: 'cameroon', label: 'Cameroon' },
    { key: 'cayman-islands', label: 'Cayman Islands' },
    { key: 'central-african-republic', label: 'Central African Republic' },
    { key: 'chad', label: 'Chad' },
    { key: 'chile', label: 'Chile' },
    { key: 'colombia', label: 'Colombia' },
    { key: 'comoros', label: 'Comoros' },
    { key: 'congo', label: 'Congo' },
    { key: 'congo-democratic-republic', label: 'Congo, Democratic Republic of the' },
    { key: 'cook-islands', label: 'Cook Islands' },
    { key: 'costa-rica', label: 'Costa Rica' },
    { key: 'cuba', label: 'Cuba' },
    { key: 'côte-divoire', label: 'C\u00f4te d\'Ivoire' },
    { key: 'korea-democratic-peoples-republic', label: 'Democratic People\'s Republic of Korea' },
    { key: 'djibouti', label: 'Djibouti' },
    { key: 'dominica', label: 'Dominica' },
    { key: 'dominican-republic', label: 'Dominican Republic' },
    { key: 'ecuador', label: 'Ecuador' },
    { key: 'egypt', label: 'Egypt' },
    { key: 'el-salvador', label: 'El Salvador' },
    { key: 'equatorial-guinea', label: 'Equatorial Guinea' },
    { key: 'eritrea', label: 'Eritrea' },
    { key: 'estonia', label: 'Estonia' },
    { key: 'swaziland', label: 'Eswatini' },
    { key: 'ethiopia', label: 'Ethiopia' },
    { key: 'fiji', label: 'Fiji' },
    { key: 'france', label: 'France' },
    { key: 'french-southern-territories', label: 'French Southern Territories' },
    { key: 'gabon', label: 'Gabon' },
    { key: 'gambia', label: 'Gambia' },
    { key: 'ghana', label: 'Ghana' },
    { key: 'grenada', label: 'Grenada' },
    { key: 'guadeloupe', label: 'Guadeloupe' },
    { key: 'guatemala', label: 'Guatemala' },
    { key: 'guinea', label: 'Guinea' },
    { key: 'guinea-bissau', label: 'Guinea-Bissau' },
    { key: 'guyana', label: 'Guyana' },
    { key: 'haiti', label: 'Haiti' },
    { key: 'honduras', label: 'Honduras' },
    { key: 'india', label: 'India' },
    { key: 'indonesia', label: 'Indonesia' },
    { key: 'iran-islamic-republic', label: 'Iran, Islamic Republic of' },
    { key: 'iraq', label: 'Iraq' },
    { key: 'jamaica', label: 'Jamaica' },
    { key: 'japan', label: 'Japan' },
    { key: 'jordan', label: 'Jordan' },
    { key: 'kenya', label: 'Kenya' },
    { key: 'kiribati', label: 'Kiribati' },
    { key: 'simulation-klanndestan', label: 'Klanndestan' },
    { key: 'kyrgyzstan', label: 'Kyrgyzstan' },
    { key: 'lao-peoples-democratic-republic', label: 'Lao People\'s Democratic Republic' },
    { key: 'lebanon', label: 'Lebanon' },
    { key: 'lesotho', label: 'Lesotho' },
    { key: 'liberia', label: 'Liberia' },
    { key: 'libya', label: 'Libya' },
    { key: 'madagascar', label: 'Madagascar' },
    { key: 'malawi', label: 'Malawi' },
    { key: 'mali', label: 'Mali' },
    { key: 'marshall-islands', label: 'Marshall Islands' },
    { key: 'martinique', label: 'Martinique' },
    { key: 'mauritania', label: 'Mauritania' },
    { key: 'mauritius', label: 'Mauritius' },
    { key: 'mexico', label: 'Mexico' },
    { key: 'micronesia-federated-states', label: 'Micronesia, Federated States of' },
    { key: 'mongolia', label: 'Mongolia' },
    { key: 'montserrat', label: 'Montserrat' },
    { key: 'mozambique', label: 'Mozambique' },
    { key: 'myanmar', label: 'Myanmar' },
    { key: 'namibia', label: 'Namibia' },
    { key: 'nauru', label: 'Nauru' },
    { key: 'nepal', label: 'Nepal' },
    { key: 'nicaragua', label: 'Nicaragua' },
    { key: 'niger', label: 'Niger' },
    { key: 'nigeria', label: 'Nigeria' },
    { key: 'niue', label: 'Niue' },
    { key: 'occupied-palestinian-territory', label: 'occupied Palestinian territory' },
    { key: 'pakistan', label: 'Pakistan' },
    { key: 'palau', label: 'Palau' },
    { key: 'panama', label: 'Panama' },
    { key: 'papua-new-guinea', label: 'Papua New Guinea' },
    { key: 'paraguay', label: 'Paraguay' },
    { key: 'peru', label: 'Peru' },
    { key: 'philippines', label: 'Philippines' },
    { key: 'puerto-rico', label: 'Puerto Rico' },
    { key: 'rwanda', label: 'Rwanda' },
    { key: 'saint-barthélemy', label: 'Saint Barth\u00e9lemy' },
    { key: 'saint-kitts-and-nevis', label: 'Saint Kitts and Nevis' },
    { key: 'saint-lucia', label: 'Saint Lucia' },
    { key: 'saint-martin-french-part', label: 'Saint Martin' },
    { key: 'saint-vincent-and-grenadines', label: 'Saint Vincent and the Grenadines' },
    { key: 'samoa', label: 'Samoa' },
    { key: 'senegal', label: 'Senegal' },
    { key: 'seychelles', label: 'Seychelles' },
    { key: 'sierra-leone', label: 'Sierra Leone' },
    { key: 'sint-maarten-dutch-part', label: 'Simland' },
    { key: 'solomon-islands', label: 'Solomon Islands' },
    { key: 'somalia', label: 'Somalia' },
    { key: 'south-africa', label: 'South Africa' },
    { key: 'south-sudan', label: 'South Sudan' },
    { key: 'sri-lanka', label: 'Sri Lanka' },
    { key: 'sudan', label: 'Sudan' },
    { key: 'switzerland', label: 'Switzerland' },
    { key: 'syrian-arab-republic', label: 'Syrian Arab Republic' },
    { key: 'são-tomé-and-príncipe', label: 'S\u00e3o Tom\u00e9 and Pr\u00edncipe' },
    { key: 'tajikistan', label: 'Tajikistan' },
    { key: 'tanzania-united-republic', label: 'Tanzania, United Republic of' },
    { key: 'thailand', label: 'Thailand' },
    { key: 'timor-leste', label: 'Timor-Leste' },
    { key: 'togo', label: 'Togo' },
    { key: 'tokelau', label: 'Tokelau' },
    { key: 'tonga', label: 'Tonga' },
    { key: 'trinidad-and-tobago', label: 'Trinidad and Tobago' },
    { key: 'tunisia', label: 'Tunisia' },
    { key: 'turkey', label: 'Turkey' },
    { key: 'turks-and-caicos-islands', label: 'Turks and Caicos Islands' },
    { key: 'tuvalu', label: 'Tuvalu' },
    { key: 'uganda', label: 'Uganda' },
    { key: 'ukraine', label: 'Ukraine' },
    { key: 'united-arab-emirates', label: 'United Arab Emirates' },
    { key: 'vanuatu', label: 'Vanuatu' },
    { key: 'venezuela-bolivarian-republic', label: 'Venezuela' },
    { key: 'virgin-islands-british', label: 'Virgin Islands, British' },
    { key: 'virgin-islands-us', label: 'Virgin Islands, U.S.' },
    { key: 'western-sahara', label: 'Western Sahara' },
    { key: 'world', label: 'World' },
    { key: 'yemen', label: 'Yemen' },
    { key: 'zambia', label: 'Zambia' },
    { key: 'zimbabwe', label: 'Zimbabwe' },
];

export const pdnaCountryList: Country[] = [
    { key: 'Somalia', label: 'Somalia' },
    { key: 'Dominica', label: 'Dominica' },
    { key: 'Sri Lanka', label: 'Sri Lanka' },
    { key: 'Sierra Leone', label: 'Sierra Leone' },
    { key: 'Saint Vincent and the Grenadines', label: 'Saint Vincent and the Grenadines' },
    { key: 'Vietnam', label: 'Vietnam' },
    { key: 'Seychelles', label: 'Seychelles' },
    { key: 'Fiji', label: 'Fiji' },
    { key: 'Myanmar', label: 'Myanmar' },
    { key: 'Georgia', label: 'Georgia' },
    { key: 'Nepal', label: 'Nepal' },
    { key: 'Vanuatu', label: 'Vanuatu' },
    { key: 'Malawi', label: 'Malawi' },
    { key: 'Cabo Verde', label: 'Cabo Verde' },
    { key: 'St. Vincent and the Grenadines', label: 'St. Vincent and the Grenadines' },
    { key: 'Bosnia and Herzegovena', label: 'Bosnia and Herzegovena' },
    { key: 'Burundi ', label: 'Burundi ' },
    { key: 'Solomon Islands', label: 'Solomon Islands' },
    { key: 'Burundi ', label: 'Burundi ' },
    { key: 'Seychelles', label: 'Seychelles' },
    { key: 'Nigeria', label: 'Nigeria' },
    { key: 'Fiji', label: 'Fiji' },
    { key: 'Samoa', label: 'Samoa' },
    { key: 'Malawi', label: 'Malawi' },
    { key: 'Bhutan', label: 'Bhutan' },
    { key: 'Pakistan', label: 'Pakistan' },
    { key: 'Thailand', label: 'Thailand' },
    { key: 'Djibouti', label: 'Djibouti' },
    { key: 'Kenya', label: 'Kenya' },
    { key: 'Lao PDR', label: 'Lao PDR' },
    { key: 'Lesotho', label: 'Lesotho' },
    { key: 'Uganda', label: 'Uganda' },
    { key: 'Benin', label: 'Benin' },
    { key: 'Guatemala', label: 'Guatemala' },
    { key: 'Togo', label: 'Togo' },
    { key: 'Pakistan', label: 'Pakistan' },
    { key: 'Moldova', label: 'Moldova' },
    { key: 'Haiti', label: 'Haiti' },
    { key: 'El Salvador', label: 'El Salvador' },
    { key: 'Cambodia', label: 'Cambodia' },
    { key: 'Lao PDR', label: 'Lao PDR' },
    { key: 'Indonesia', label: 'Indonesia' },
    { key: 'Samoa', label: 'Samoa' },
    { key: 'Philippines', label: 'Philippines' },
    { key: 'Bhutan', label: 'Bhutan' },
    { key: 'Burkina Faso ', label: 'Burkina Faso ' },
    { key: 'Senegal', label: 'Senegal' },
    { key: 'Central African Republic', label: 'Central African Republic' },
    { key: 'Namibia', label: 'Namibia' },
    { key: 'Yemen', label: 'Yemen' },
    { key: 'Haiti', label: 'Haiti' },
    { key: 'India', label: 'India' },
    { key: 'Myanmar', label: 'Myanmar' },
    { key: 'Bolivia', label: 'Bolivia' },
    { key: 'Madagascar', label: 'Madagascar' },
    { key: 'Bangladesh', label: 'Bangladesh' },
];

export interface ReliefWebParams {
    'primary-country'?: string;
    country?: string;
    from?: string;
    to?: string;
}

export interface UnhcrParams {
    country?: string;
    date_from?: string;
    date_to?: string;
}

export interface RssFeedParams {
    'feed-url': string;
    'title-field': string;
    'date-field': string;
    'source-field': string;
    'author-field': string;
    'url-field': string;
}

export interface AtomFeedParams {
    'feed-url': string;
    'title-field': string;
    'date-field': string;
    'source-field': string;
    'author-field': string;
    'url-field': string;
}

export interface HumanitarianResponseParams {
    country?: string;
}

export interface PdnaParams {
    country?: string;
}

// FIXME: Change this to actual EMM params
// Currently EMM is not used and shown
export interface EmmParams {
}

export type SourceInput = Omit<DeepMandatory<PurgeNull<ConnectorSourceGqInputType>, 'clientId'>, 'source' | 'params'> & ({
    source: 'RELIEF_WEB';
    params: ReliefWebParams;
} | {
    source: 'RSS_FEED';
    params: RssFeedParams;
} | {
    source: 'EMM';
    params: EmmParams;
} | {
    source: 'ATOM_FEED';
    params: AtomFeedParams;
} | {
    source: 'HUMANITARIAN_RESP';
    params: HumanitarianResponseParams;
} | {
    source: 'PDNA';
    params: PdnaParams;
} | {
    source: 'UNHCR';
    params: UnhcrParams;
});

export type ConnectorInputType = DeepReplace<
    PurgeNull<UnifiedConnectorWithSourceInputType>,
    ConnectorSourceGqInputType,
    SourceInput
>;