"use client"

import React, { useEffect, useRef, useState } from 'react'
import styles from './page.module.css'
import { Loader } from '@googlemaps/js-api-loader'

// Add type definitions for AdvancedMarkerElement
declare global {
  namespace google.maps {
    class AdvancedMarkerElement {
      constructor(options: {
        map?: Map;
        position: LatLngLiteral;
        title?: string;
      });
      map: Map | null;
      position: LatLngLiteral;
      title?: string;
      addListener(event: string, handler: Function): void;
    }
  }
}

// Add type for marker library
interface MarkerLibrary {
  AdvancedMarkerElement: typeof google.maps.AdvancedMarkerElement;
}

type CSC = {
  id: number;
  name: string;
  coordinates: [number, number]; // [longitude, latitude]
  description: string;
  address: string;
  state: string;
  district: string;
  subdistrict: string;
  village: string;
  services: string[];
  imageUrl?: string;
};

type LocationFilters = {
  state: string;
  district: string;
  subdistrict: string;
  village: string;
};

// Define route state type
interface RouteState {
  distance: string;
  duration: string;
}

// Helper to convert [number, number] to LatLngLiteral
const toLatLngLiteral = (coord: [number, number] | { lat: number; lng: number }): google.maps.LatLngLiteral => {
  if (Array.isArray(coord)) {
    return { lat: coord[1], lng: coord[0] };
  }
  return coord;
};

const Page = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<number | null>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const [userMarker, setUserMarker] = useState<any | null>(null);
  const [filters, setFilters] = useState<LocationFilters>({
    state: "",
    district: "",
    subdistrict: "",
    village: ""
  });
  const [showDirections, setShowDirections] = useState<boolean>(false);
  const [startLocation, setStartLocation] = useState<[number, number] | null>(null);
  const [startLocationName, setStartLocationName] = useState<string>('');
  const [startSearchQuery, setStartSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [route, setRoute] = useState<RouteState | null>(null);
  const [routeLayer, setRouteLayer] = useState<any>(null);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [showSearchDropdown, setShowSearchDropdown] = useState<boolean>(false);
  const [isRouteFetching, setIsRouteFetching] = useState<boolean>(false);
  const [directionsFrom, setDirectionsFrom] = useState<'current' | 'search'>('current');
  const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService | null>(null);
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null);
  const [placesService, setPlacesService] = useState<google.maps.places.PlacesService | null>(null);
  const [autocompleteService, setAutocompleteService] = useState<google.maps.places.AutocompleteService | null>(null);

  // Common Service Centers data
  const cscLocations: CSC[] = [
    // Mumbai CSCs
    {
      id: 1,
      name: "Mumbai Central CSC",
      coordinates: [72.8245, 18.9695],
      description: "Main Common Service Center for Aadhaar, PAN and passport services in Mumbai.",
      address: "Near Mumbai Central Station, Mumbai 400008",
      state: "Maharashtra",
      district: "Mumbai",
      subdistrict: "Mumbai Central",
      village: "Mumbai Central",
      services: ["Aadhaar", "PAN Card", "Passport", "Voter ID"],
      imageUrl: "https://images.unsplash.com/photo-1596005554384-d293674c91d7?q=80&w=200"
    },
    {
      id: 2,
      name: "Andheri CSC",
      coordinates: [72.8691, 19.1136],
      description: "Common Service Center for all government services in western suburbs.",
      address: "Near Andheri Station, Mumbai 400058",
      state: "Maharashtra",
      district: "Mumbai",
      subdistrict: "Andheri",
      village: "Andheri East",
      services: ["Aadhaar", "PAN Card", "Utility Bills", "Insurance"]
    },
    {
      id: 3,
      name: "Dadar CSC",
      coordinates: [72.8410, 19.0178],
      description: "Central Mumbai CSC with multiple government scheme services.",
      address: "Dadar West, Mumbai 400028",
      state: "Maharashtra",
      district: "Mumbai",
      subdistrict: "Dadar",
      village: "Dadar West",
      services: ["Aadhaar", "Banking", "Pension Schemes", "Certificates"]
    },
    {
      id: 30,
      name: "Bandra Digital Seva Kendra",
      coordinates: [72.8296, 19.0596],
      description: "Comprehensive digital services hub for West Mumbai residents.",
      address: "Linking Road, Bandra West, Mumbai 400050",
      state: "Maharashtra",
      district: "Mumbai",
      subdistrict: "Bandra",
      village: "Bandra West",
      services: ["Aadhaar", "PAN Card", "Banking", "Education Registration", "Skill Development"],
      imageUrl: "https://images.unsplash.com/photo-1590796583326-afd3bb20d22d?q=80&w=200"
    },
    {
      id: 31,
      name: "Borivali E-Governance Center",
      coordinates: [72.8560, 19.2307],
      description: "North Mumbai digital services center with focus on senior citizens.",
      address: "S.V. Road, Borivali West, Mumbai 400092",
      state: "Maharashtra",
      district: "Mumbai",
      subdistrict: "Borivali",
      village: "Borivali West",
      services: ["Aadhaar", "Pension Services", "Health Registration", "Digital Literacy", "Bill Payments"]
    },
    // Bangalore CSCs
    {
      id: 4,
      name: "Koramangala CSC",
      coordinates: [77.6216, 12.9279],
      description: "Digital service center for all government schemes.",
      address: "80 Feet Road, Koramangala, Bangalore 560034",
      state: "Karnataka",
      district: "Bangalore",
      subdistrict: "Koramangala",
      village: "Koramangala",
      services: ["Aadhaar", "PAN Card", "Property Registration", "Banking"],
      imageUrl: "https://images.unsplash.com/photo-1541183710533-d40c1b56aed3?q=80&w=200"
    },
    {
      id: 5,
      name: "Indiranagar CSC",
      coordinates: [77.6408, 12.9784],
      description: "Common Service Center for digital services in East Bangalore.",
      address: "100 Feet Road, Indiranagar, Bangalore 560038",
      state: "Karnataka",
      district: "Bangalore",
      subdistrict: "Indiranagar",
      village: "Indiranagar",
      services: ["Aadhaar", "Pension Schemes", "Digital Literacy", "Bills Payment"]
    },
    {
      id: 32,
      name: "Indiranagar Digital Hub",
      coordinates: [77.6497, 12.9744],
      description: "Premium digital services center with minimal wait times.",
      address: "12th Main Road, Indiranagar, Bangalore 560038",
      state: "Karnataka",
      district: "Bangalore",
      subdistrict: "Indiranagar",
      village: "Indiranagar East",
      services: ["Aadhaar", "Passport", "GST Registration", "Company Registration", "International Money Transfer"]
    },
    {
      id: 6,
      name: "Jayanagar CSC",
      coordinates: [77.5961, 12.9258],
      description: "South Bangalore CSC with full range of government services.",
      address: "11th Main Road, Jayanagar, Bangalore 560041",
      state: "Karnataka",
      district: "Bangalore",
      subdistrict: "Jayanagar",
      village: "Jayanagar",
      services: ["Aadhaar", "Banking", "Insurance", "Skill Development"]
    },
    {
      id: 33,
      name: "Whitefield G2C Center",
      coordinates: [77.7406, 12.9698],
      description: "IT corridor service center with extended working hours.",
      address: "Whitefield Main Road, Bangalore 560066",
      state: "Karnataka",
      district: "Bangalore",
      subdistrict: "Whitefield",
      village: "Whitefield",
      services: ["Aadhaar", "PAN Card", "Professional Tax", "Visa Services", "NRI Services"]
    },
    {
      id: 34,
      name: "Electronic City Digital Point",
      coordinates: [77.6701, 12.8458],
      description: "Tech hub digital services center with advanced facilities.",
      address: "Phase 1, Electronic City, Bangalore 560100",
      state: "Karnataka",
      district: "Bangalore",
      subdistrict: "Electronic City",
      village: "Electronic City",
      services: ["Aadhaar", "Digital Certificate", "Income Tax Filing", "Startup Registration", "Digital Signature"]
    },
    // Delhi CSCs
    {
      id: 7,
      name: "Connaught Place CSC",
      coordinates: [77.2100, 28.6329],
      description: "Central Delhi CSC with all government digital services.",
      address: "Block C, Connaught Place, New Delhi 110001",
      state: "Delhi",
      district: "Central Delhi",
      subdistrict: "Connaught Place",
      village: "Connaught Place",
      services: ["Aadhaar", "PAN Card", "Passport", "Voter ID"],
      imageUrl: "https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?q=80&w=200"
    },
    {
      id: 8,
      name: "Lajpat Nagar CSC",
      coordinates: [77.2433, 28.5693],
      description: "South Delhi digital service center for all government schemes.",
      address: "Lajpat Nagar Market, New Delhi 110024",
      state: "Delhi",
      district: "South Delhi",
      subdistrict: "Lajpat Nagar",
      village: "Lajpat Nagar",
      services: ["Aadhaar", "Banking", "Insurance", "Education Registration"]
    },
    {
      id: 35,
      name: "Lajpat Nagar Digital Zone",
      coordinates: [77.2393, 28.5713],
      description: "Modern digital services hub with express counters.",
      address: "Central Market, Lajpat Nagar, New Delhi 110024",
      state: "Delhi",
      district: "South Delhi",
      subdistrict: "Lajpat Nagar",
      village: "Lajpat Nagar Central",
      services: ["Aadhaar", "Foreign Exchange", "Passport", "Property Registration", "Legal Services"]
    },
    {
      id: 9,
      name: "Dwarka CSC",
      coordinates: [77.0266, 28.5823],
      description: "West Delhi Common Service Center with all government facilities.",
      address: "Sector 6, Dwarka, New Delhi 110075",
      state: "Delhi",
      district: "West Delhi",
      subdistrict: "Dwarka",
      village: "Dwarka Sector 6",
      services: ["Aadhaar", "PAN Card", "Driving License", "Certificates"]
    },
    {
      id: 36,
      name: "Dwarka Digital Square",
      coordinates: [77.0366, 28.5923],
      description: "Flagship digital services center with premium facilities.",
      address: "Sector 10, Dwarka, New Delhi 110075",
      state: "Delhi",
      district: "West Delhi",
      subdistrict: "Dwarka",
      village: "Dwarka Sector 10",
      services: ["Aadhaar", "Immigration Services", "Land Records", "Court Services", "Employment Registration"]
    },
    // Kolkata CSCs
    {
      id: 10,
      name: "Park Street CSC",
      coordinates: [88.3639, 22.5550],
      description: "Central Kolkata digital services hub with all facilities.",
      address: "Park Street, Kolkata 700016",
      state: "West Bengal",
      district: "Kolkata",
      subdistrict: "Park Street",
      village: "Park Street",
      services: ["Aadhaar", "PAN Card", "Passport", "Banking", "Insurance"],
      imageUrl: "https://images.unsplash.com/photo-1514222134-b57cbb8ce073?q=80&w=200"
    },
    {
      id: 11,
      name: "Salt Lake E-Governance Center",
      coordinates: [88.4177, 22.5726],
      description: "Major digital facility in Salt Lake IT sector.",
      address: "Sector V, Salt Lake, Kolkata 700091",
      state: "West Bengal",
      district: "Kolkata",
      subdistrict: "Salt Lake",
      village: "Salt Lake Sector V",
      services: ["Aadhaar", "Digital Certificate", "Property Tax", "Health Cards", "Pension"]
    },
    {
      id: 12,
      name: "New Town Digital Hub",
      coordinates: [88.4636, 22.6253],
      description: "Modern digital services center in New Town Smart City zone.",
      address: "Action Area I, New Town, Kolkata 700156",
      state: "West Bengal",
      district: "Kolkata",
      subdistrict: "New Town",
      village: "New Town Action Area I",
      services: ["Aadhaar", "Smart Card", "Utility Bills", "Startup Registration", "Government Schemes"]
    },
    // Chennai CSCs
    {
      id: 13,
      name: "T.Nagar Service Center",
      coordinates: [80.2329, 13.0416],
      description: "Primary digital services hub in central Chennai.",
      address: "Thyagaraya Road, T.Nagar, Chennai 600017",
      state: "Tamil Nadu",
      district: "Chennai",
      subdistrict: "T.Nagar",
      village: "T.Nagar",
      services: ["Aadhaar", "TN e-Services", "PAN Card", "Property Registration"]
    },
    {
      id: 14,
      name: "Adyar Digital Point",
      coordinates: [80.2574, 13.0048],
      description: "South Chennai comprehensive digital service center.",
      address: "Gandhi Nagar, Adyar, Chennai 600020",
      state: "Tamil Nadu",
      district: "Chennai",
      subdistrict: "Adyar",
      village: "Gandhi Nagar",
      services: ["Aadhaar", "Banking", "Driving License", "Education Services", "Utility Payments"]
    },
    {
      id: 15,
      name: "Anna Nagar CSC",
      coordinates: [80.2098, 13.0850],
      description: "Major west Chennai digital services facility.",
      address: "2nd Avenue, Anna Nagar, Chennai 600040",
      state: "Tamil Nadu",
      district: "Chennai",
      subdistrict: "Anna Nagar",
      village: "Anna Nagar East",
      services: ["Aadhaar", "Passport", "Insurance", "Income Tax", "Business Registration"]
    },
    // Hyderabad CSCs
    {
      id: 16,
      name: "Banjara Hills MeeSeva",
      coordinates: [78.4456, 17.4156],
      description: "Premium digital services center in upscale Banjara Hills.",
      address: "Road No. 12, Banjara Hills, Hyderabad 500034",
      state: "Telangana",
      district: "Hyderabad",
      subdistrict: "Banjara Hills",
      village: "Banjara Hills",
      services: ["Aadhaar", "Telangana e-Services", "Passport", "Land Records", "Banking"],
      imageUrl: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?q=80&w=200"
    },
    {
      id: 17,
      name: "HITEC City Digital Center",
      coordinates: [78.3762, 17.4452],
      description: "Tech hub digital services with extended working hours.",
      address: "HITEC City Main Road, Hyderabad 500081",
      state: "Telangana",
      district: "Hyderabad",
      subdistrict: "HITEC City",
      village: "Madhapur",
      services: ["Aadhaar", "PAN Card", "International Services", "Company Registration", "Employment"]
    },
    {
      id: 18,
      name: "Secunderabad Services Hub",
      coordinates: [78.5046, 17.4399],
      description: "Major digital services center for North Hyderabad residents.",
      address: "S.D. Road, Secunderabad, Hyderabad 500003",
      state: "Telangana",
      district: "Hyderabad",
      subdistrict: "Secunderabad",
      village: "Secunderabad",
      services: ["Aadhaar", "Voter ID", "Digital Literacy", "Banking", "Defense Pension"]
    },
    // Pune CSCs
    {
      id: 19,
      name: "Koregaon Park Service Center",
      coordinates: [73.8967, 18.5362],
      description: "Comprehensive digital services hub in East Pune.",
      address: "North Main Road, Koregaon Park, Pune 411001",
      state: "Maharashtra",
      district: "Pune",
      subdistrict: "Koregaon Park",
      village: "Koregaon Park",
      services: ["Aadhaar", "PAN Card", "Property Tax", "Banking", "Certificates"]
    },
    {
      id: 20,
      name: "Hinjewadi Digital Hub",
      coordinates: [73.7379, 18.5994],
      description: "IT park service center catering to tech professionals.",
      address: "Phase 2, Hinjewadi IT Park, Pune 411057",
      state: "Maharashtra",
      district: "Pune",
      subdistrict: "Hinjewadi",
      village: "Hinjewadi Phase 2",
      services: ["Aadhaar", "Income Tax Filing", "Digital Signature", "Passport", "Visa Services"]
    },
    {
      id: 21,
      name: "Aundh CSC",
      coordinates: [73.8071, 18.5589],
      description: "Modern digital services facility in Northwest Pune.",
      address: "D.P. Road, Aundh, Pune 411007",
      state: "Maharashtra",
      district: "Pune",
      subdistrict: "Aundh",
      village: "Aundh",
      services: ["Aadhaar", "PAN Card", "Property Registration", "Banking", "Education"]
    },
    // Jaipur CSCs
    {
      id: 22,
      name: "Vaishali Nagar E-Mitra",
      coordinates: [75.7525, 26.9349],
      description: "Major Rajasthan government digital services kendra.",
      address: "Vaishali Nagar, Jaipur 302021",
      state: "Rajasthan",
      district: "Jaipur",
      subdistrict: "Vaishali Nagar",
      village: "Vaishali Nagar",
      services: ["Aadhaar", "Bhamashah", "PAN Card", "Utility Bills", "Certificates"],
      imageUrl: "https://images.unsplash.com/photo-1546479904-a1c973a910cd?q=80&w=200"
    },
    {
      id: 23,
      name: "C-Scheme Digital Center",
      coordinates: [75.7873, 26.9124],
      description: "Central Jaipur premium digital services facility.",
      address: "Civil Lines, C-Scheme, Jaipur 302001",
      state: "Rajasthan",
      district: "Jaipur",
      subdistrict: "C-Scheme",
      village: "Civil Lines",
      services: ["Aadhaar", "PAN Card", "Property Registration", "Passport", "Business Licenses"]
    },
    {
      id: 24,
      name: "Malviya Nagar Jan Seva Kendra",
      coordinates: [75.8236, 26.8535],
      description: "South Jaipur comprehensive digital services hub.",
      address: "Malviya Nagar, Jaipur 302017",
      state: "Rajasthan",
      district: "Jaipur",
      subdistrict: "Malviya Nagar",
      village: "Malviya Nagar",
      services: ["Aadhaar", "Banking", "Education Registration", "Jan Aadhaar", "Social Security"]
    },
    // Ahmedabad CSCs
    {
      id: 25,
      name: "CG Road Jan Seva Kendra",
      coordinates: [72.5682, 23.0334],
      description: "Central Ahmedabad digital services facility.",
      address: "CG Road, Navrangpura, Ahmedabad 380009",
      state: "Gujarat",
      district: "Ahmedabad",
      subdistrict: "Navrangpura",
      village: "Navrangpura",
      services: ["Aadhaar", "PAN Card", "Digital Gujarat", "Banking", "Certificates"]
    },
    {
      id: 26,
      name: "SG Highway E-Governance Center",
      coordinates: [72.5166, 23.0145],
      description: "Western Ahmedabad premium digital services hub.",
      address: "SG Highway, Ahmedabad 380054",
      state: "Gujarat",
      district: "Ahmedabad",
      subdistrict: "SG Highway",
      village: "Bodakdev",
      services: ["Aadhaar", "GST Registration", "Digital Signature", "Property", "Business Services"]
    },
    {
      id: 27,
      name: "GIFT City Digital Hub",
      coordinates: [72.6841, 23.1612],
      description: "Advanced digital services center with international facilities.",
      address: "GIFT City, Gandhinagar 382355",
      state: "Gujarat",
      district: "Gandhinagar",
      subdistrict: "GIFT City",
      village: "GIFT City",
      services: ["Aadhaar", "International Banking", "Forex Services", "Business Registration", "Legal Services"]
    },
    // Lucknow CSCs
    {
      id: 28,
      name: "Gomti Nagar Jan Seva Kendra",
      coordinates: [80.9957, 26.8623],
      description: "Major UP government digital services facility.",
      address: "Vibhuti Khand, Gomti Nagar, Lucknow 226010",
      state: "Uttar Pradesh",
      district: "Lucknow",
      subdistrict: "Gomti Nagar",
      village: "Vibhuti Khand",
      services: ["Aadhaar", "UP e-District", "PAN Card", "Banking", "Public Welfare Schemes"]
    },
    {
      id: 29,
      name: "Hazratganj Digital Center",
      coordinates: [80.9462, 26.8540],
      description: "Central Lucknow comprehensive digital services hub.",
      address: "Hazratganj, Lucknow 226001",
      state: "Uttar Pradesh",
      district: "Lucknow",
      subdistrict: "Hazratganj",
      village: "Hazratganj",
      services: ["Aadhaar", "PAN Card", "Birth Certificate", "Income Certificate", "Property Registration"],
      imageUrl: "https://images.unsplash.com/photo-1624634574132-202fbb15af51?q=80&w=200"
    },
    // More diverse locations in smaller cities
    {
      id: 37,
      name: "Shimla Digital Hub",
      coordinates: [77.1734, 31.1048],
      description: "Mountain region's primary digital services center.",
      address: "The Mall Road, Shimla 171001",
      state: "Himachal Pradesh",
      district: "Shimla",
      subdistrict: "Mall Road",
      village: "Mall Road",
      services: ["Aadhaar", "HP e-District", "Land Records", "Tourism Permits", "Certificates"]
    },
    {
      id: 38,
      name: "Varanasi Jan Seva Kendra",
      coordinates: [83.0060, 25.3176],
      description: "Heritage city digital services facility.",
      address: "Lanka, Varanasi 221005",
      state: "Uttar Pradesh",
      district: "Varanasi",
      subdistrict: "Lanka",
      village: "Lanka",
      services: ["Aadhaar", "Religious Tourism Services", "PAN Card", "Banking", "Property Records"]
    },
    {
      id: 39,
      name: "Kochi Digital Center",
      coordinates: [76.2673, 9.9312],
      description: "Coastal Kerala's comprehensive e-governance facility.",
      address: "MG Road, Ernakulam, Kochi 682011",
      state: "Kerala",
      district: "Ernakulam",
      subdistrict: "MG Road",
      village: "Ernakulam",
      services: ["Aadhaar", "Akshaya e-Kendras", "Coastal Services", "Banking", "International Services"]
    },
    {
      id: 40,
      name: "Guwahati Digital Point",
      coordinates: [91.7362, 26.1445],
      description: "Northeast India's premier digital services hub.",
      address: "GS Road, Guwahati 781005",
      state: "Assam",
      district: "Kamrup Metropolitan",
      subdistrict: "GS Road",
      village: "Bhangagarh",
      services: ["Aadhaar", "NE Special Services", "PAN Card", "Land Records", "Tribal Certificates"]
    },
    // Madhya Pradesh CSCs
    {
      id: 41,
      name: "PRAHLAD COMPUTER'S & ONLINE WORK",
      coordinates: [80.6843, 22.8916],
      description: "Common Service Center providing digital services in Mandla district.",
      address: "GRAM AHMADPUR, POST GHAGHA TEH MANDLA, MANDLA, MADHYA PRADESH - 481661",
      state: "Madhya Pradesh",
      district: "Mandla",
      subdistrict: "Mandla",
      village: "Ahmadpur",
      services: ["Aadhaar", "PAN Card", "MP e-District", "Banking", "Certificate Services"],
      imageUrl: "https://images.unsplash.com/photo-1596005554384-d293674c91d7?q=80&w=200"
    },
    {
      id: 42,
      name: "MATA PITA COMPUTER",
      coordinates: [80.3700, 22.5966],
      description: "Rural digital services center for Narayanganj region.",
      address: "KODARA, NARAYANGANJ, MANDLA, MADHYA PRADESH-481661",
      state: "Madhya Pradesh",
      district: "Mandla",
      subdistrict: "Narayanganj",
      village: "Kodara",
      services: ["Aadhaar", "Banking", "MP Online", "Certificate Services", "Bill Payments"]
    },
    {
      id: 43,
      name: "SATGURU ONLINE AND STAITIONARY",
      coordinates: [80.3397, 22.7163],
      description: "Digital services and stationery supplies for Gwari area.",
      address: "GWARI, MANDLA, MANDLA, MADHYA PRADESH-481661",
      state: "Madhya Pradesh",
      district: "Mandla",
      subdistrict: "Mandla",
      village: "Gwari",
      services: ["Aadhaar", "PAN Card", "Stationery", "Banking", "MP e-District"]
    },
    {
      id: 44,
      name: "CSC KHARI",
      coordinates: [80.3686, 22.6020],
      description: "Village level digital services provider.",
      address: "VILLAGE KHARI, MANDLA, MADHYA PRADESH - 481661",
      state: "Madhya Pradesh",
      district: "Mandla",
      subdistrict: "Mandla",
      village: "Khari",
      services: ["Aadhaar", "Banking", "Insurance", "Bill Payments", "Certificate Services"]
    },
    {
      id: 45,
      name: "MA REWA COMPUTER",
      coordinates: [80.3709, 22.5980],
      description: "Market center digital services provider.",
      address: "BAJAR CHOK, BAKORI MANDLA, MANDLA, MADHYA PRADESH - 481661",
      state: "Madhya Pradesh",
      district: "Mandla",
      subdistrict: "Mandla",
      village: "Bakori",
      services: ["Aadhaar", "PAN Card", "Computer Training", "Banking", "MP e-District"]
    },
    {
      id: 46,
      name: "PRATIBHA ONLINE COMPUTER",
      coordinates: [80.2886, 22.7528],
      description: "Digital services center on Jujhari main road.",
      address: "JUJHARI MAIN ROAD, INDIAN, NIWAS, MANDLA, MADHYA PRADESH - 481662",
      state: "Madhya Pradesh",
      district: "Mandla",
      subdistrict: "Niwas",
      village: "Jujhari",
      services: ["Aadhaar", "Banking", "Digital Services", "MP Online", "Certificates"]
    },
    {
      id: 47,
      name: "PRATIBHA BAIRAGI GANESH ONLINE",
      coordinates: [80.2886, 22.7528],
      description: "Common digital services provider in Narayanganj.",
      address: "CHIRAI DONGRI MAL., NARAYANGANJ, MANDLA, MADHYA PRADESH-481662",
      state: "Madhya Pradesh",
      district: "Mandla",
      subdistrict: "Narayanganj",
      village: "Chirai Dongri",
      services: ["Aadhaar", "Banking", "Insurance", "Pension Services", "MP e-District"]
    },
    {
      id: 48,
      name: "CSC CENTRE - RAMKUMAR",
      coordinates: [77.6407, 24.7078],
      description: "Digital services center in Shadhora region.",
      address: "SHADHORA, ASHOKNAGAR, MADHYA PRADESH - 473330",
      state: "Madhya Pradesh",
      district: "Ashoknagar",
      subdistrict: "Shadhora",
      village: "Shadhora",
      services: ["Aadhaar", "Banking", "MP e-District", "Certificate Services", "Social Welfare Schemes"]
    },
    {
      id: 49,
      name: "COMMON SERVICE CENTRE - DILEEP",
      coordinates: [77.6153, 24.7185],
      description: "Comprehensive government service provider in Shadhora.",
      address: "SHADHORA, ASHOKNAGAR, MADHYA PRADESH - 473330",
      state: "Madhya Pradesh",
      district: "Ashoknagar",
      subdistrict: "Shadhora",
      village: "Shadhora",
      services: ["Aadhaar", "PAN Card", "Banking", "Insurance", "MP Online"]
    },
    {
      id: 50,
      name: "CSC CENTRE - PAWAN",
      coordinates: [77.6411, 24.7077],
      description: "Digital services hub for Shadhora community.",
      address: "SHADHORA, ASHOKNAGAR, MADHYA PRADESH - 473330",
      state: "Madhya Pradesh",
      district: "Ashoknagar",
      subdistrict: "Shadhora",
      village: "Shadhora",
      services: ["Aadhaar", "Banking", "Social Welfare", "Rural Development", "MP e-District"]
    },
    {
      id: 51,
      name: "CSC CENTER - ISAGARH",
      coordinates: [77.7953, 24.5715],
      description: "Digital services provider for Isagarh region.",
      address: "ISAGARH, ASHOKNAGAR, MADHYA PRADESH - 473331",
      state: "Madhya Pradesh",
      district: "Ashoknagar",
      subdistrict: "Isagarh",
      village: "Isagarh",
      services: ["Aadhaar", "Banking", "MP Online", "Insurance", "Certificate Services"]
    },
    {
      id: 52,
      name: "JAN SEVA KENDRA CSC CHIROLI",
      coordinates: [77.6107, 24.7103],
      description: "Public service digital center for Chiroli area.",
      address: "CHIROLI, SHADHORA, ASHOK NAGAR, MADHYA PRADESH-473330",
      state: "Madhya Pradesh",
      district: "Ashoknagar",
      subdistrict: "Shadhora",
      village: "Chiroli",
      services: ["Aadhaar", "PAN Card", "Banking", "Social Welfare", "MP Online"]
    },
    {
      id: 53,
      name: "ANUJ JATAV CSC",
      coordinates: [77.5919, 24.6302],
      description: "Digital services provider for Umari village.",
      address: "UMARI, ASHOKNAGAR, ASHOK NAGAR, MADHYA PRADESH-473330",
      state: "Madhya Pradesh",
      district: "Ashoknagar",
      subdistrict: "Ashoknagar",
      village: "Umari",
      services: ["Aadhaar", "Banking", "Insurance", "MP e-District", "Rural Services"]
    },
    {
      id: 54,
      name: "BAGULYA JAN SEVA KENDRA",
      coordinates: [77.6407, 24.7078], // Using approximate coordinates since specific ones weren't provided
      description: "Village level Common Service Center for Bagulya.",
      address: "BAGULYA, SHADHORA, ASHOKNAGAR, MADHYA PRADESH - 473330",
      state: "Madhya Pradesh",
      district: "Ashoknagar",
      subdistrict: "Shadhora",
      village: "Bagulya",
      services: ["Aadhaar", "Banking", "MP Online", "Rural Development Services", "Social Welfare"]
    }
  ];

  // Get unique values for filter dropdowns
  const getUniqueValues = (field: keyof CSC) => {
    const values = new Set(cscLocations.map(csc => csc[field]));
    return [...values].filter(Boolean).sort() as string[];
  };

  const states = getUniqueValues('state');
  
  const districts = filters.state ? 
    getUniqueValues('district').filter(district => 
      cscLocations.some(csc => 
        csc.state === filters.state && csc.district === district
      )
    ) : getUniqueValues('district');
    
  const subdistricts = filters.district ? 
    getUniqueValues('subdistrict').filter(subdistrict => 
      cscLocations.some(csc => 
        csc.district === filters.district && csc.subdistrict === subdistrict
      )
    ) : getUniqueValues('subdistrict');

  const villages = filters.subdistrict ?
    getUniqueValues('village').filter(village =>
      cscLocations.some(csc =>
        csc.subdistrict === filters.subdistrict && csc.village === village
      )
    ) : getUniqueValues('village');

  // Filter locations based on selected filters
  const filteredLocations = cscLocations.filter(csc => {
    return (!filters.state || csc.state === filters.state) &&
           (!filters.district || csc.district === filters.district) &&
           (!filters.subdistrict || csc.subdistrict === filters.subdistrict) &&
           (!filters.village || csc.village === filters.village);
  });

  // Handle filter changes
  const handleFilterChange = (field: keyof LocationFilters, value: string) => {
    // Reset subsequent filters when a parent filter changes
    const updatedFilters = { ...filters, [field]: value };
    
    if (field === 'state') {
      updatedFilters.district = '';
      updatedFilters.subdistrict = '';
      updatedFilters.village = '';
      
      // If state is selected, zoom to that state's bounds
      if (value && map) {
        const stateLocations = cscLocations.filter(csc => csc.state === value);
        if (stateLocations.length > 0) {
          const bounds = new google.maps.LatLngBounds();
          stateLocations.forEach(location => {
            bounds.extend({ 
              lat: location.coordinates[1], 
              lng: location.coordinates[0] 
            });
          });

          // Add padding to the bounds
          const padding = { top: 100, right: 100, bottom: 100, left: 100 };
          
          // Set zoom restrictions for state level
          map.setOptions({
            minZoom: 5,
            maxZoom: 15,
            restriction: {
              latLngBounds: bounds,
              strictBounds: false
            }
          });

          // Smooth zoom to bounds
          const currentZoom = map.getZoom() || 5;
          const targetZoom = Math.min(7, currentZoom + 2); // Gradual zoom increase
          
          // First pan to center of bounds
          const center = bounds.getCenter();
          map.panTo(center);
          
          // Then smoothly zoom
          setTimeout(() => {
            map.fitBounds(bounds, padding);
          }, 300);
        }
      } else {
        // Reset restrictions when no state is selected
        map?.setOptions({
          minZoom: 4,
          maxZoom: 18,
          restriction: null
        });
      }
    } else if (field === 'district') {
      updatedFilters.subdistrict = '';
      updatedFilters.village = '';
      
      // If district is selected, zoom to that district's bounds
      if (value && map) {
        const districtLocations = cscLocations.filter(csc => 
          csc.state === filters.state && csc.district === value
        );
        if (districtLocations.length > 0) {
          const bounds = new google.maps.LatLngBounds();
          districtLocations.forEach(location => {
            bounds.extend({ 
              lat: location.coordinates[1], 
              lng: location.coordinates[0] 
            });
          });

          // Add padding to the bounds
          const padding = { top: 100, right: 100, bottom: 100, left: 100 };
          
          // Set zoom restrictions for district level
          map.setOptions({
            minZoom: 7,
            maxZoom: 18,
            restriction: {
              latLngBounds: bounds,
              strictBounds: false
            }
          });

          // Smooth zoom to bounds
          const currentZoom = map.getZoom() || 7;
          const targetZoom = Math.min(9, currentZoom + 2); // Gradual zoom increase
          
          // First pan to center of bounds
          const center = bounds.getCenter();
          map.panTo(center);
          
          // Then smoothly zoom
          setTimeout(() => {
            map.fitBounds(bounds, padding);
          }, 300);
        }
      }
    } else if (field === 'subdistrict') {
      updatedFilters.village = '';
    }
    
    setFilters(updatedFilters);
    
    // If there's only one filtered location after applying filter, select it
    const newFilteredLocations = cscLocations.filter(csc => {
      return (!updatedFilters.state || csc.state === updatedFilters.state) &&
             (!updatedFilters.district || csc.district === updatedFilters.district) &&
             (!updatedFilters.subdistrict || csc.subdistrict === updatedFilters.subdistrict) &&
             (!updatedFilters.village || csc.village === updatedFilters.village);
    });
    
    if (newFilteredLocations.length === 1) {
      setSelectedLocation(newFilteredLocations[0].id);
      if (map) {
        const bounds = new google.maps.LatLngBounds();
        bounds.extend({ 
          lat: newFilteredLocations[0].coordinates[1], 
          lng: newFilteredLocations[0].coordinates[0] 
        });
        
        // Smooth zoom to single location
        const center = bounds.getCenter();
        map.panTo(center);
        
        setTimeout(() => {
        map.fitBounds(bounds);
        }, 300);
      }
    } else if (newFilteredLocations.length > 0) {
      // Center map to show all filtered locations
      updateMapBounds(newFilteredLocations);
    }
  };

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      // Get initial location
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation([position.coords.longitude, position.coords.latitude]);
          
          // Update accuracy circle if it exists
          if (map && position.coords.accuracy) {
            const accuracyCircle = new google.maps.Circle({
              map: map,
              center: { lat: position.coords.latitude, lng: position.coords.longitude },
              radius: position.coords.accuracy,
              fillColor: "#4285F4",
              fillOpacity: 0.15,
              strokeColor: "#4285F4",
              strokeOpacity: 0.5,
              strokeWeight: 1,
              zIndex: 999
            });
          }
        },
        (error) => {
          console.log("Location access denied or unavailable. Showing default view of India.");
          setCurrentLocation([78.9629, 20.5937]);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );

      // Watch for location changes
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          setCurrentLocation([position.coords.longitude, position.coords.latitude]);
          
          // Update accuracy circle if it exists
          if (map && position.coords.accuracy) {
            const accuracyCircle = new google.maps.Circle({
              map: map,
              center: { lat: position.coords.latitude, lng: position.coords.longitude },
              radius: position.coords.accuracy,
              fillColor: "#4285F4",
              fillOpacity: 0.15,
              strokeColor: "#4285F4",
              strokeOpacity: 0.5,
              strokeWeight: 1,
              zIndex: 999
            });
          }
        },
        (error) => {
          console.log("Error watching location:", error);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );

      // Cleanup watch on component unmount
      return () => {
        navigator.geolocation.clearWatch(watchId);
      };
    }
  }, [map]); // Added map as dependency

  // Initialize Google Maps with controls
  useEffect(() => {
    const loader = new Loader({
      apiKey: "AIzaSyANzH7BnNww8JixawdiJ77ogUFxulYwXCE",
      version: "weekly",
      libraries: ["places", "marker"]
    });

    loader.load().then(async () => {
      if (mapRef.current) {
        const mapInstance = new google.maps.Map(mapRef.current, {
          center: currentLocation ? toLatLngLiteral(currentLocation) : { lat: 20.5937, lng: 78.9629 },
          zoom: 5,
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true,
          zoomControl: true,
          gestureHandling: "cooperative",
          mapId: "csc_map_id",
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }]
            }
          ]
        });

        setMap(mapInstance);
        setDirectionsService(new google.maps.DirectionsService());
        setDirectionsRenderer(new google.maps.DirectionsRenderer({
          map: mapInstance,
          suppressMarkers: true,
          polylineOptions: {
            strokeColor: '#00A86B',
            strokeWeight: 6,
            strokeOpacity: 0.8
          }
        }));
        setPlacesService(new google.maps.places.PlacesService(mapInstance));
        setAutocompleteService(new google.maps.places.AutocompleteService());

        // Add markers after map is loaded
        google.maps.event.addListenerOnce(mapInstance, 'idle', () => {
          addMarkers(mapInstance);
          addUserMarker(mapInstance);
        });
      }
    });
  }, []);

  // Get route between two points
  const getRoute = async (start: [number, number], end: [number, number]) => {
    if (!directionsService || !directionsRenderer) return;

    try {
      const result = await directionsService.route({
        origin: { lat: start[1], lng: start[0] } as google.maps.LatLngLiteral,
        destination: { lat: end[1], lng: end[0] } as google.maps.LatLngLiteral,
        travelMode: google.maps.TravelMode.DRIVING
      });

      directionsRenderer.setDirections(result);
      setRoute({
        distance: result.routes[0].legs[0].distance?.text || '',
        duration: result.routes[0].legs[0].duration?.text || ''
      });
    } catch (error) {
      console.error('Error getting route:', error);
      setRoute(null);
    }
  };

  // Clear route
  const clearRoute = () => {
    if (directionsRenderer) {
      const emptyResult: google.maps.DirectionsResult = {
        routes: [],
        request: {
          origin: { lat: 0, lng: 0 },
          destination: { lat: 0, lng: 0 },
          travelMode: google.maps.TravelMode.DRIVING
        }
      };
      directionsRenderer.setDirections(emptyResult);
    }
    setRoute(null);
  };

  // Search locations using Google Places Autocomplete
  const searchLocations = async (term: string): Promise<void> => {
    if (!autocompleteService || !map) return;

    try {
      const request: google.maps.places.AutocompletionRequest = {
        input: term,
        componentRestrictions: { country: 'in' },
        types: ['geocode', 'establishment']
      };

      const response = await autocompleteService.getPlacePredictions(request);
      if (response.predictions) {
        setSearchResults(response.predictions);
      }
    } catch (error) {
      console.error('Error searching locations:', error);
      setSearchResults([]);
    }
  };

  // Select a location from search results
  const selectSearchResult = async (result: google.maps.places.AutocompletePrediction) => {
    if (!placesService) return;

    try {
      const place = await new Promise<google.maps.places.PlaceResult>((resolve, reject) => {
        placesService.getDetails({
          placeId: result.place_id,
          fields: ['geometry', 'name']
        }, (place, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && place) {
            resolve(place);
          } else {
            reject(new Error('Place details not found'));
          }
        });
      });

      if (place.geometry?.location) {
        const coordinates: [number, number] = [
          place.geometry.location.lng(),
          place.geometry.location.lat()
        ];
        
        setStartLocation(coordinates);
        setStartLocationName(result.description);
        setStartSearchQuery(result.description);
        setShowSearchDropdown(false);
        
        if (selectedLocation) {
          getRoute(coordinates, getSelectedLocationCoords());
        }
      }
    } catch (error) {
      console.error('Error getting place details:', error);
    }
  };

  // Get coordinates of selected location
  const getSelectedLocationCoords = (): [number, number] => {
    const selected = cscLocations.find(loc => loc.id === selectedLocation);
    return selected ? selected.coordinates : [0, 0];
  };

  // Show directions panel
  const handleShowDirections = (locationId: number) => {
    setSelectedLocation(locationId);
    setShowDirections(true);
    
    // If using current location and it's available, get route
    if (directionsFrom === 'current' && currentLocation) {
      const selectedCoords = cscLocations.find(loc => loc.id === locationId)?.coordinates || [0, 0];
      getRoute(currentLocation, selectedCoords);
    }
  };

  // Close directions panel
  const handleCloseDirections = () => {
    setShowDirections(false);
    clearRoute();
  };

  // Get directions from current location
  const getDirectionsFromCurrentLocation = () => {
    if (currentLocation && selectedLocation) {
      setDirectionsFrom('current');
      const selectedCoords = getSelectedLocationCoords();
      getRoute(currentLocation, selectedCoords).catch(err => {
        console.error("Failed to get directions from current location:", err);
        // Error is handled inside getRoute function
      });
    }
  };

  // Add custom styled markers for CSC locations
  const addMarkers = async (mapInstance: google.maps.Map) => {
    if (!mapInstance) return;
    
    // Clear existing markers
    markers.forEach(marker => marker.map = null);
    const newMarkers: google.maps.AdvancedMarkerElement[] = [];
    
    // Import AdvancedMarkerElement
    const { AdvancedMarkerElement } = await google.maps.importLibrary("marker") as MarkerLibrary;
    
    // Add markers for each location
    filteredLocations.forEach((location) => {
      // Create marker
      const marker = new AdvancedMarkerElement({
        map: mapInstance,
        position: { lat: location.coordinates[1], lng: location.coordinates[0] },
        title: location.name
      });

      // Create info window content
      const content = document.createElement('div');
      content.innerHTML = `
        <div style="padding: 15px; max-width: 280px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h3 style="margin-top: 0; color: #1a3a5f; font-weight: 600;">${location.name}</h3>
          ${location.imageUrl ? `
            <div style="margin: 10px 0; width: 100%; height: 120px; overflow: hidden; border-radius: 6px;">
              <img src="${location.imageUrl}" alt="${location.name}" 
                   style="width: 100%; height: 100%; object-fit: cover;" />
            </div>
          ` : ''}
          <p style="margin: 8px 0; font-weight: 500;"><strong>Address:</strong> ${location.address}</p>
          <p style="margin: 8px 0; color: #555;">${location.description}</p>
          <div style="margin: 10px 0;">
            <strong>Services:</strong>
            <div style="display: flex; flex-wrap: wrap; gap: 5px; margin-top: 5px;">
              ${location.services.map(service => 
                `<span style="background: #e3f2fd; color: #1976D2; padding: 3px 8px; 
                 border-radius: 4px; font-size: 12px;">${service}</span>`
              ).join('')}
            </div>
          </div>
          <p style="margin: 8px 0; color: #666;"><strong>District:</strong> ${location.district}, ${location.state}</p>
          <button id="getDirectionsBtn" 
                  style="background: #1976D2; color: white; border: none; padding: 8px 16px; 
                  border-radius: 4px; cursor: pointer; margin-top: 5px; width: 100%;">
            Get Directions
          </button>
        </div>
      `;

      const infoWindow = new google.maps.InfoWindow({
        content: content
      });

      // Add click event to marker
      marker.addListener('click', () => {
        setSelectedLocation(location.id);
        mapInstance.panTo({ lat: location.coordinates[1], lng: location.coordinates[0] });
        mapInstance.setZoom(14);
        infoWindow.open(mapInstance, marker);

        // Add click event to the Get Directions button after the info window is opened
        setTimeout(() => {
          const getDirectionsBtn = content.querySelector('#getDirectionsBtn');
          if (getDirectionsBtn) {
            getDirectionsBtn.addEventListener('click', () => {
              handleShowDirections(location.id);
            });
          }
        }, 100);
      });

      newMarkers.push(marker);
    });

    setMarkers(newMarkers);
  };

  // Add user location marker
  const addUserMarker = async (mapInstance: google.maps.Map) => {
    if (!mapInstance || !currentLocation) return;
    
    if (userMarker) {
      userMarker.map = null;
    }
    
    // Create a blue dot marker for user location
    const userLocationMarker = new google.maps.Marker({
      map: mapInstance,
      position: { lat: currentLocation[1], lng: currentLocation[0] },
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: "#4285F4",
        fillOpacity: 1,
        strokeColor: "#ffffff",
        strokeWeight: 2,
      },
      title: "Your Location",
      zIndex: 1000 // Ensure it's always on top
    });

    // Add accuracy circle
    const accuracyCircle = new google.maps.Circle({
      map: mapInstance,
      center: { lat: currentLocation[1], lng: currentLocation[0] },
      radius: 50, // Default radius, will be updated with actual accuracy
      fillColor: "#4285F4",
      fillOpacity: 0.15,
      strokeColor: "#4285F4",
      strokeOpacity: 0.5,
      strokeWeight: 1,
      zIndex: 999
    });

    // Create info window content
    const content = document.createElement('div');
    content.innerHTML = `
        <div style="padding: 12px; max-width: 220px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <h3 style="margin-top: 0; color: #1976D2; font-weight: 600;">Your Location</h3>
          <p style="margin: 5px 0; color: #333;">This is your current position</p>
        </div>
    `;

    const infoWindow = new google.maps.InfoWindow({
      content: content
    });

    userLocationMarker.addListener('click', () => {
      infoWindow.open(mapInstance, userLocationMarker);
    });

    setUserMarker(userLocationMarker);

    // Update accuracy circle when location changes
    return () => {
      if (accuracyCircle) {
        accuracyCircle.setMap(null);
      }
    };
  };

  // Update markers when selected location changes or filters change
  useEffect(() => {
    if (map) {
      addMarkers(map);
      addUserMarker(map); // Always add user marker when markers are updated
    }
  }, [selectedLocation, filters, map, currentLocation]); // Added currentLocation dependency
  
  // Handle clicking on a location in the list
  const handleLocationClick = (location: CSC) => {
    setSelectedLocation(location.id);
    
    if (map) {
      const position: google.maps.LatLngLiteral = { 
        lat: location.coordinates[1], 
        lng: location.coordinates[0] 
      };
      map.panTo(position);
      map.setZoom(14);
    }
    
    // If start location is already set, get route
    if (startLocation) {
      getRoute(startLocation, location.coordinates);
    }
  };

  // Center map on user location
  const goToMyLocation = () => {
    if (map && currentLocation) {
      const position: google.maps.LatLngLiteral = { 
        lat: currentLocation[1], 
        lng: currentLocation[0] 
      };
      map.panTo(position);
      map.setZoom(15);
    }
  };

  // Reset all filters
  const resetFilters = () => {
    setFilters({
      state: "",
      district: "",
      subdistrict: "",
      village: ""
    });
    setSelectedLocation(null);
    
    if (map) {
      // Reset map options
      map.setOptions({
        minZoom: 4,
        maxZoom: 18,
        restriction: null
      });

      const bounds = new google.maps.LatLngBounds();
      cscLocations.forEach(location => {
        bounds.extend({ 
          lat: location.coordinates[1], 
          lng: location.coordinates[0] 
        });
      });

      // Add padding to the bounds
      const padding = { top: 100, right: 100, bottom: 100, left: 100 };
      
      // First pan to center
      const center = bounds.getCenter();
      map.panTo(center);
      
      // Then smoothly zoom out
      setTimeout(() => {
        map.fitBounds(bounds, padding);
      }, 300);
    }
  };

  // Update the map bounds to show all locations
  const updateMapBounds = (locations: CSC[]) => {
    if (!map || locations.length === 0) return;
    
    const bounds = new google.maps.LatLngBounds();
    locations.forEach(location => {
      bounds.extend({ lat: location.coordinates[1], lng: location.coordinates[0] });
    });
    
    // Add padding to the bounds
    const padding = { top: 100, right: 100, bottom: 100, left: 100 };
    
    // First pan to center
    const center = bounds.getCenter();
    map.panTo(center);
    
    // Then smoothly zoom
    setTimeout(() => {
      map.fitBounds(bounds, padding);
    }, 300);
  };

  // Clear route when selected location changes
  useEffect(() => {
    if (directionsRenderer) {
      const emptyResult: google.maps.DirectionsResult = {
        routes: [],
        request: {
          origin: { lat: 0, lng: 0 },
          destination: { lat: 0, lng: 0 },
          travelMode: google.maps.TravelMode.DRIVING
        }
      };
      directionsRenderer.setDirections(emptyResult);
    }
    setRoute(null);
    
    if (selectedLocation) {
      setShowDirections(true);
    } else {
      setShowDirections(false);
    }
  }, [selectedLocation]);

  // Initialize map with all locations
  useEffect(() => {
    if (map) {
      const bounds = new google.maps.LatLngBounds();
      cscLocations.forEach(location => {
        bounds.extend({ 
          lat: location.coordinates[1], 
          lng: location.coordinates[0] 
        });
      });
      map.fitBounds(bounds);
    }
  }, [map, cscLocations]);

  return (
    <div className={styles.container} style={{height: '100vh'}}>
      <div className={styles.mapContainer} id="map" ref={mapRef}>
        {showDirections && route && route.distance && route.duration && (
          <div style={{
            position: 'absolute',
            bottom: '20px',
            left: '20px',
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            padding: '1rem',
            zIndex: 1000,
            maxWidth: '300px',
            width: '100%'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.5rem'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
              <h3 style={{
                margin: 0,
                fontSize: '1rem',
                color: '#1a3a5f',
                fontWeight: '600'
              }}>Route Information</h3>
            </div>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.5rem'
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
              <span style={{ color: '#666', fontSize: '0.9rem' }}>{route.distance}</span>
            </div>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 6v6l4 2"/>
              </svg>
              <span style={{ color: '#666', fontSize: '0.9rem' }}>{route.duration}</span>
            </div>
          </div>
        )}
      </div>
      
      <div className={styles.sidebar} style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%'
      }}>
        <div className={styles.filterSection} style={{
          // flex: '0 0 50%',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          marginBottom: '1rem'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            color: '#1a3a5f',
            marginBottom: '1rem',
            fontWeight: '600',
            textAlign: 'center',
            padding: '0.5rem',
            borderBottom: '2px solid #e3f2fd'
          }}>Find Common Service Centers</h2>
          
          <div className={styles.filters} style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1rem',
            padding: '0.5rem'
          }}>
            <div className={styles.filterItem}>
              <label htmlFor="state" style={{
                display: 'block',
                marginBottom: '0.25rem',
                color: '#1a3a5f',
                fontWeight: '500',
                fontSize: '0.9rem'
              }}>State</label>
              <select 
                id="state"
                value={filters.state}
                onChange={(e) => handleFilterChange('state', e.target.value)}
                className={styles.selectInput}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '8px',
                  border: '1px solid #e0e0e0',
                  backgroundColor: 'white',
                  fontSize: '0.9rem',
                  color: '#333',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }}
              >
                <option value="">All States</option>
                {states.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>
            
            <div className={styles.filterItem}>
              <label htmlFor="district" style={{
                display: 'block',
                marginBottom: '0.25rem',
                color: '#1a3a5f',
                fontWeight: '500',
                fontSize: '0.9rem'
              }}>District</label>
              <select 
                id="district"
                value={filters.district}
                onChange={(e) => handleFilterChange('district', e.target.value)}
                className={styles.selectInput}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '8px',
                  border: '1px solid #e0e0e0',
                  backgroundColor: 'white',
                  fontSize: '0.9rem',
                  color: '#333',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }}
              >
                <option value="">All Districts</option>
                {districts.map(district => (
                  <option key={district} value={district}>{district}</option>
                ))}
              </select>
            </div>
            
            <div className={styles.filterItem}>
              <label htmlFor="subdistrict" style={{
                display: 'block',
                marginBottom: '0.25rem',
                color: '#1a3a5f',
                fontWeight: '500',
                fontSize: '0.9rem'
              }}>Subdistrict</label>
              <select 
                id="subdistrict"
                value={filters.subdistrict}
                onChange={(e) => handleFilterChange('subdistrict', e.target.value)}
                className={styles.selectInput}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '8px',
                  border: '1px solid #e0e0e0',
                  backgroundColor: 'white',
                  fontSize: '0.9rem',
                  color: '#333',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }}
              >
                <option value="">All Subdistricts</option>
                {subdistricts.map(subdistrict => (
                  <option key={subdistrict} value={subdistrict}>{subdistrict}</option>
                ))}
              </select>
            </div>

            <div className={styles.filterItem}>
              <label htmlFor="village" style={{
                display: 'block',
                marginBottom: '0.25rem',
                color: '#1a3a5f',
                fontWeight: '500',
                fontSize: '0.9rem'
              }}>Village</label>
              <select 
                id="village"
                value={filters.village}
                onChange={(e) => handleFilterChange('village', e.target.value)}
                className={styles.selectInput}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '8px',
                  border: '1px solid #e0e0e0',
                  backgroundColor: 'white',
                  fontSize: '0.9rem',
                  color: '#333',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }}
              >
                <option value="">All Villages</option>
                {villages.map(village => (
                  <option key={village} value={village}>{village}</option>
                ))}
              </select>
            </div>
          </div>
            
          <div className={styles.filterActions} style={{
            display: 'flex',
            gap: '1rem',
            marginTop: '1rem',
            padding: '0 0.5rem'
          }}>
            <button onClick={resetFilters} style={{
              flex: 1,
              padding: '0.5rem',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#f5f5f5',
              color: '#333',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              fontSize: '0.9rem'
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                <path d="M3 3v5h5"/>
              </svg>
              Reset
            </button>
            <button onClick={goToMyLocation} style={{
              flex: 1,
              padding: '0.5rem',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#1976D2',
              color: 'white',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              fontSize: '0.9rem'
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <circle cx="12" cy="12" r="4"/>
              </svg>
              My Location
            </button>
          </div>
        </div>
        
        <div className={styles.locationsList} style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          padding: '1.5rem',
          flex: '1',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <h3 style={{
            margin: '0 0 1rem 0',
            color: '#1a3a5f',
            fontSize: '1.25rem',
            fontWeight: '600',
            paddingBottom: '0.5rem',
            borderBottom: '2px solid #e3f2fd'
          }}>CSC Locations {filteredLocations.length > 0 ? `(${filteredLocations.length})` : ''}</h3>
            
            {filteredLocations.length === 0 ? (
            <div style={{
              padding: '2rem',
              textAlign: 'center',
              color: '#666',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              flex: 1
            }}>No CSCs found with current filters</div>
          ) : (
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              overflowY: 'auto',
              flex: 1
            }}>
                {filteredLocations.map((location) => (
                  <li 
                    key={location.id}
                    className={`${styles.locationItem} ${selectedLocation === location.id ? styles.selected : ''}`}
                    onClick={() => handleLocationClick(location)}
                  style={{
                    backgroundColor: selectedLocation === location.id ? '#e3f2fd' : 'white',
                    borderRadius: '8px',
                    padding: '1rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    border: '1px solid #e0e0e0'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '1rem'
                  }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{
                        margin: '0 0 0.5rem 0',
                        color: '#1a3a5f',
                        fontSize: '1.1rem',
                        fontWeight: '600'
                      }}>{location.name}</h4>
                      <p style={{
                        margin: '0 0 0.25rem 0',
                        color: '#666',
                        fontSize: '0.9rem'
                      }}>{location.address}</p>
                      <p style={{
                        margin: '0 0 0.5rem 0',
                        color: '#666',
                        fontSize: '0.9rem'
                      }}>{location.subdistrict}, {location.district}</p>
                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '0.5rem'
                      }}>
                        {location.services.slice(0, 3).map((service, idx) => (
                          <span key={idx} style={{
                            backgroundColor: '#e3f2fd',
                            color: '#1976D2',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.85rem',
                            fontWeight: '500'
                          }}>{service}</span>
                        ))}
                        {location.services.length > 3 && (
                          <span style={{
                            backgroundColor: '#e3f2fd',
                            color: '#1976D2',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.85rem',
                            fontWeight: '500'
                          }}>+{location.services.length - 3} more</span>
                        )}
                      </div>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShowDirections(location.id);
                      }}
                      style={{
                        backgroundColor: '#1976D2',
                        color: 'white',
                        border: 'none',
                        padding: '0.5rem 1rem',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.9rem',
                        fontWeight: '500'
                      }}
                      aria-label="Get directions"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                      </svg>
                      Directions
                    </button>
                  </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
      </div>
    </div>
  );
};

export default Page;