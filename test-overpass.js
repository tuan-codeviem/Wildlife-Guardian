const overpassQuery = `
    [out:json][timeout:10];
    (
      node["amenity"="veterinary"](around:500000,16.4637,107.5909);
      node["amenity"="animal_shelter"](around:500000,16.4637,107.5909);
      node["shop"="pet"](around:500000,16.4637,107.5909);
    );
    out center 2;
`;
fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    body: "data=" + encodeURIComponent(overpassQuery),
    headers: { 
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "WildlifeGuardian/1.0"
    }
}).then(r=>r.text()).then(console.log);
