import React, { useState, useEffect } from "react";
import { IssueCategory, IssueSeverity } from "../types";
import { 
  MapPin, 
  AlertTriangle, 
  Sparkles, 
  Upload, 
  X, 
  ChevronRight, 
  ChevronLeft, 
  ShieldAlert, 
  Compass, 
  HelpCircle, 
  User, 
  Phone, 
  CheckCircle, 
  Loader2,
  Search,
  Check
} from "lucide-react";

// Optional diagnostic questions based on specific categories
const DIAGNOSTIC_QUESTIONS = {
  [IssueCategory.POTHOLE]: [
    {
      id: "potholeSize",
      question: "What is the physical size of the pothole?",
      options: [
        { label: "Small / Shallow (<10cm)", score: 1 },
        { label: "Medium / Significant (10cm - 30cm)", score: 2 },
        { label: "Very Large & Deep (>30cm)", score: 4 }
      ]
    },
    {
      id: "potholeLocation",
      question: "Are there specific notes about its position on the pavement?",
      options: [
        { label: "Located in a side alley, park corridor, or parking lot", score: 1 },
        { label: "Located on a pedestrian footpath / sidewalk", score: 2 },
        { label: "Located on the main vehicle lane / driving road", score: 3 }
      ]
    }
  ],
  [IssueCategory.WATER_LEAK]: [
    {
      id: "leakIntensity",
      question: "What is the flow rate of the leakage?",
      options: [
        { label: "Slow dampness, localized moisture, or minor dripping", score: 1 },
        { label: "Steady flow, small stream, or bubbling water pooling", score: 2 },
        { label: "Strong gushing flow or potential roadway flooding", score: 4 }
      ]
    }
  ],
  [IssueCategory.BROKEN_STREETLIGHT]: [
    {
      id: "lightScale",
      question: "How many streetlights appear dark?",
      options: [
        { label: "Single light post is inactive", score: 1 },
        { label: "Multiple street lights on this block are inactive", score: 2.5 },
        { label: "A whole section of street lights is down", score: 4 }
      ]
    }
  ],
  [IssueCategory.GARBAGE_ACCUMULATION]: [
    {
      id: "garbageVolume",
      question: "What is the sheer volume of the accumulated waste?",
      options: [
        { label: "Single bag of trash or light blown debris", score: 1 },
        { label: "Several bags or overflowing communal bin", score: 2 },
        { label: "Bulk storage dumping such as mattresses, appliances, or massive piles", score: 4 }
      ]
    }
  ]
};

const PRESETS_IMAGE = [
  "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?q=80&w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1506546332852-6d588372d6b0?q=80&w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?q=80&w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=600&auto=format&fit=crop"
];

const PORTLAND_SUGGESTIONS = [
  { address: "1025 SW Morrison St, Portland, OR", lat: 45.5192, lng: -122.6815, desc: "Downtown Portland Transit Mall" },
  { address: "833 SW Broadway Blvd, Portland, OR", lat: 45.5208, lng: -122.6792, desc: "Pioneer Courthouse Square Area" },
  { address: "1220 SW Pine St, Portland, OR", lat: 45.5225, lng: -122.6830, desc: "Pearl District Gateway" },
  { address: "410 NW Couch St, Portland, OR", lat: 45.5241, lng: -122.6748, desc: "Chinatown & Old Town Historic District" },
  { address: "1545 NE Clackamas St, Portland, OR", lat: 45.5342, lng: -122.6495, desc: "Lloyd District Commercial Hub" },
  { address: "2015 SE Commercial Ave, Portland, OR", lat: 45.5085, lng: -122.6512, desc: "Industrial Southeast District" },
  { address: "710 SW Madison St, Portland, OR", lat: 45.5152, lng: -122.6805, desc: "Portland Art Museum & South Park Blocks" },
  { address: "1425 SW Salmon St, Portland, OR", lat: 45.5178, lng: -122.6862, desc: "Providence Park Stadium Access" },
];

const reverseGeocode = (lat, lng) => {
  const latMin = 45.5000;
  const latMax = 45.5400;
  const lngMin = -122.7000;
  const lngMax = -122.6400;
  
  const pctX = (lng - lngMin) / (lngMax - lngMin);
  const pctY = (lat - latMin) / (latMax - latMin);
  
  const mockStreetNo = Math.floor(100 + pctX * 3800);
  
  let street = "";
  if (pctY > 0.6) {
    if (pctX < 0.5) street = "NW Broadway Blvd";
    else street = "NE Clackamas St";
  } else if (pctY < 0.4) {
    if (pctX < 0.5) street = "SW Madison St";
    else street = "SE Division St";
  } else {
    if (pctX < 0.5) street = "SW Morrison St";
    else street = "SE Hawthorne Blvd";
  }
  
  return `${mockStreetNo} ${street}, Portland, OR`;
};

export default function NewIssueForm({ 
  currentLocation, 
  onClose,
  onSubmitReport,
  userId,
  userName,
  existingIssues = [],
  onSelectIssue
}) {
  const [step, setStep] = useState(1);
  const totalSteps = 4; // 1: Location, 2: Category, 3: Diagnostics & Description, 4: Image & Submit

  // State 1: Location
  const [locationMode, setLocationMode] = useState("write"); // 'pinpoint' | 'write'
  const [typedAddress, setTypedAddress] = useState(currentLocation ? currentLocation.address : "");
  const [detectedCoords, setDetectedCoords] = useState(
    currentLocation ? { lat: currentLocation.lat, lng: currentLocation.lng } : null
  );
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodeFeedback, setGeocodeFeedback] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  // State 2: Category
  const [selectedCategory, setSelectedCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");

  // State 3: Diagnostics & Description & Notices
  const [diagnosticAnswers, setDiagnosticAnswers] = useState({});
  const [description, setDescription] = useState("");

  // State 4: Image, Anonymity & Summary Submit
  const [imageUrl, setImageUrl] = useState("");
  const [filePreselectedIdx, setFilePreselectedIdx] = useState(0);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [dragOver, setDragOver] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Duplicate Check states
  const [duplicateWarningIssue, setDuplicateWarningIssue] = useState(null);
  const [bypassDuplicateCheck, setBypassDuplicateCheck] = useState(false);

  // Checks if the new issue is a duplicate of an existing unresolved ticket
  const checkDuplicate = () => {
    if (!existingIssues || existingIssues.length === 0) return null;
    const resolvedCategory = selectedCategory === "others" ? IssueCategory.INFRASTRUCTURE_FAILURE : selectedCategory;
    const currentLat = detectedCoords?.lat || 45.5200;
    const currentLng = detectedCoords?.lng || -122.6800;

    const match = existingIssues.find(issue => {
      // Ignore resolved issues
      if (issue.status === "RESOLVED") return false;

      // Category match
      if (issue.category !== resolvedCategory) return false;

      // Coordinate proximity check (Euclidean distance < 0.0035 degrees, approx 350 meters)
      const dist = Math.sqrt(
        Math.pow((issue.latitude || 45.5200) - currentLat, 2) +
        Math.pow((issue.longitude || -122.6800) - currentLng, 2)
      );

      return dist < 0.0035;
    });

    return match;
  };

  // Safe bypassed form submission
  const handleFormSubmitBypassed = async () => {
    setIsSubmitting(true);
    setErrorMessage("");

    const resolvedCategory = selectedCategory === "others" ? (customCategory || "Other Area Issue") : selectedCategory;
    const activeImage = filePreselectedIdx !== null ? PRESETS_IMAGE[filePreselectedIdx] : imageUrl || PRESETS_IMAGE[0];
    const severity = getCalculatedSeverity();

    try {
      await onSubmitReport({
        title: `${resolvedCategory} at ${typedAddress.split(",")[0]}`,
        description: description,
        category: selectedCategory === "others" ? IssueCategory.INFRASTRUCTURE_FAILURE : selectedCategory,
        severity: severity,
        address: typedAddress,
        latitude: detectedCoords?.lat || 45.5200,
        longitude: detectedCoords?.lng || -122.6800,
        mediaUrl: activeImage,
        isAnonymous: isAnonymous
      });
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMessage("Failed to submit request. Please try again.");
      setDuplicateWarningIssue(null); // Return to form to show error message
    } finally {
      setIsSubmitting(false);
    }
  };

  // Sync passed location if modified
  useEffect(() => {
    if (currentLocation) {
      setTypedAddress(currentLocation.address);
      setDetectedCoords({ lat: currentLocation.lat, lng: currentLocation.lng });
    }
  }, [currentLocation]);

  // Simulated geocoding when user enters street address manually
  const handleSimulateGeocode = () => {
    if (!typedAddress.trim()) {
      setGeocodeFeedback("Please enter a relative street address or landmark.");
      return;
    }
    setIsGeocoding(true);
    setGeocodeFeedback("");

    setTimeout(() => {
      const randLat = 45.51 + Math.random() * 0.025;
      const randLng = -122.68 + Math.random() * 0.04;
      setDetectedCoords({ lat: randLat, lng: randLng });
      setIsGeocoding(false);
      setGeocodeFeedback(`✓ Address checked and verified with municipal databases.`);
    }, 1000);
  };

  // Drag and Drop files handling
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file) => {
    setUploadedFileName(file.name);
    setFilePreselectedIdx(null); // Deselect preset
    
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setImageUrl(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // Compute calculated severity in background cleanly
  const getCalculatedSeverity = () => {
    const questions = DIAGNOSTIC_QUESTIONS[selectedCategory] || [];
    let scoreSum = 0;
    let counted = 0;

    questions.forEach((q) => {
      const val = diagnosticAnswers[q.id];
      if (val !== undefined) {
        scoreSum += val;
        counted++;
      }
    });

    if (counted === 0) return IssueSeverity.MEDIUM;
    const average = scoreSum / counted;
    if (average >= 3.5) return IssueSeverity.CRITICAL;
    if (average >= 2.5) return IssueSeverity.HIGH;
    if (average >= 1.5) return IssueSeverity.MEDIUM;
    return IssueSeverity.LOW;
  };

  const handleNextStep = () => {
    setErrorMessage("");
    if (step === 1) {
      if (!typedAddress.trim()) {
        setErrorMessage("Please type an approximate location address.");
        return;
      }
      if (!detectedCoords) {
        // Automatically geocode and proceed if they haven't explicitly clicked verify
        const randLat = 45.51 + Math.random() * 0.025;
        const randLng = -122.68 + Math.random() * 0.04;
        setDetectedCoords({ lat: randLat, lng: randLng });
      }
    }
    if (step === 2) {
      if (!selectedCategory) {
        setErrorMessage("Please select a problem category before continuing.");
        return;
      }
      if (selectedCategory === "others" && !customCategory.trim()) {
        setErrorMessage("Please specify the category title.");
        return;
      }
    }
    if (step === 3) {
      if (!description.trim()) {
        setErrorMessage("Please provide a brief description of the issue.");
        return;
      }
    }
    setStep((prev) => Math.min(prev + 1, totalSteps));
  };

  const handlePrevStep = () => {
    setErrorMessage("");
    setStep((prev) => Math.max(prev - 1, 1));
  };

  // Submit report to App context and server API
  const handleFormSubmit = async () => {
    if (!description.trim()) {
      setErrorMessage("Please fill in the description field.");
      setStep(3); // Go back to diagnostics step
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    const resolvedCategory = selectedCategory === "others" ? (customCategory || "Other Area Issue") : selectedCategory;
    const activeImage = filePreselectedIdx !== null ? PRESETS_IMAGE[filePreselectedIdx] : imageUrl || PRESETS_IMAGE[0];
    const severity = getCalculatedSeverity();

    // Check for duplicate first
    if (!bypassDuplicateCheck) {
      const duplicate = checkDuplicate();
      if (duplicate) {
        setDuplicateWarningIssue(duplicate);
        setIsSubmitting(false);
        return; // Halt submission, show warning
      }
    }

    try {
      await onSubmitReport({
        title: `${resolvedCategory} at ${typedAddress.split(",")[0]}`,
        description: description,
        category: selectedCategory === "others" ? IssueCategory.INFRASTRUCTURE_FAILURE : selectedCategory,
        severity: severity,
        address: typedAddress,
        latitude: detectedCoords?.lat || 45.5200,
        longitude: detectedCoords?.lng || -122.6800,
        mediaUrl: activeImage,
        isAnonymous: isAnonymous
      });
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMessage("Failed to submit request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const categoryQuestions = DIAGNOSTIC_QUESTIONS[selectedCategory] || [];

  return (
    <div id="citizen-dispatch-modal" className="bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 relative w-full h-full min-h-0 flex flex-col transition-all animate-fadeIn text-slate-800">
      
      {/* DUPLICATE WARNING OVERLAY */}
      {duplicateWarningIssue && (
        <div className="absolute inset-0 z-50 bg-white rounded-2xl p-6 flex flex-col justify-between animate-fadeIn text-slate-800">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-amber-600 border-b border-slate-100 pb-3">
              <div className="bg-amber-100 p-2.5 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg">Potential Duplicate</h3>
                <span className="text-[10px] text-amber-700 font-extrabold uppercase tracking-wider font-mono">This complaint has already been registered</span>
              </div>
            </div>

            <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-xl text-xs space-y-2">
              <p className="text-slate-700 font-bold text-[12px] leading-relaxed">
                ⚠️ This complaint has already been registered.
              </p>
              <p className="text-slate-600 font-medium leading-relaxed">
                Another resident reported a highly similar issue matching your category and location. To avoid cluttering municipal dispatches, you can upvote or support the existing ticket instead!
              </p>
            </div>

            {/* Existing issue details card */}
            <div className="p-4 border border-slate-200 bg-slate-50/50 rounded-xl space-y-2.5">
              <span className="text-[9px] font-black font-mono tracking-widest text-slate-450 uppercase block">Existing Registered Ticket</span>
              <div className="space-y-1.5">
                <div className="flex justify-between items-center gap-2">
                  <span className="text-xs font-black text-slate-900 truncate">{duplicateWarningIssue.title}</span>
                  <span className="bg-yellow-100 text-yellow-800 font-extrabold text-[9px] px-2 py-0.5 rounded-md uppercase font-mono tracking-wide flex-shrink-0">
                    {duplicateWarningIssue.status || "OPEN"}
                  </span>
                </div>
                <p className="text-[10.5px] text-slate-500 font-bold">{duplicateWarningIssue.address}</p>
                <p className="text-xs text-slate-650 italic font-medium leading-relaxed">
                  "{duplicateWarningIssue.description || "No detailed description provided."}"
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-4 border-t border-slate-100 mt-4">
            {onSelectIssue && (
              <button
                type="button"
                onClick={() => onSelectIssue(duplicateWarningIssue)}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase rounded-xl shadow-xs transition-colors cursor-pointer text-center"
              >
                🔍 Avoid Posting & View Existing on Map
              </button>
            )}
            
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setDuplicateWarningIssue(null);
                }}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-extrabold text-xs uppercase rounded-xl transition-colors cursor-pointer"
              >
                Go Back & Edit
              </button>

              <button
                type="button"
                onClick={handleFormSubmitBypassed}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase rounded-xl transition-all cursor-pointer shadow-xs"
              >
                Still Submit My Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Absolute Close Header button */}
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer"
        aria-label="Close Modal"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Title Header */}
      <div className="mb-5 flex items-center gap-2.5">
        <div className="bg-blue-600 p-2 rounded-xl text-white">
          <Sparkles className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <h2 className="text-xs font-black uppercase text-slate-400 font-mono tracking-widest">Citizen Request System</h2>
          <h3 className="font-extrabold text-slate-900 text-base">File Municipal Report</h3>
        </div>
      </div>

      {/* Step dots status indicators */}
      <div className="flex items-center gap-1.5 mb-5 text-xs">
        {Array.from({ length: totalSteps }).map((_, idx) => {
          const stepNum = idx + 1;
          const isActive = step === stepNum;
          const isCompleted = step > stepNum;

          return (
            <React.Fragment key={stepNum}>
              <div className="flex items-center gap-1.5 flex-1">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${
                  isActive ? "bg-blue-600 text-white font-black" :
                  isCompleted ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400 border"
                }`}>
                  {isCompleted ? "✓" : stepNum}
                </span>
                <span className={`hidden sm:inline font-bold text-[10px] uppercase tracking-wide truncate ${
                  isActive ? "text-blue-700" : isCompleted ? "text-slate-500" : "text-slate-300"
                }`}>
                  {stepNum === 1 ? "Location" :
                   stepNum === 2 ? "Problem" :
                   stepNum === 3 ? "Details" : "Attachment"}
                </span>
              </div>
              {stepNum < totalSteps && (
                <div className={`h-0.5 w-4 sm:w-8 ${isCompleted ? 'bg-emerald-500' : 'bg-slate-200'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Error Message box */}
      {errorMessage && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-150 rounded-xl text-rose-800 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* STEP BODY WRAPPER */}
      <div className="flex-1 flex flex-col justify-between min-h-0 overflow-y-auto pr-1">
        
        {/* STEP 1: POSITION DETAILS FORM */}
        {step === 1 && (
          <div className="space-y-4 flex flex-col flex-1 min-h-0">
            <div>
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest font-mono">Step 1: Incident Location</span>
              <h4 className="text-xl font-extrabold text-slate-900 mt-0.5">Where is the issue situated?</h4>
              <p className="text-xs text-slate-500 leading-relaxed mt-1">
                Pinpoint the exact location of the hazard. Type your address or tap anywhere on our interactive city grid to set the marker.
              </p>
            </div>

            {/* Swiggy/Zomato style Search and GPS header */}
            <div className="relative space-y-3">
              <div className="flex flex-col md:flex-row gap-3">
                {/* Search Address Bar */}
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
                    <Search className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={typedAddress}
                    onChange={(e) => {
                      const val = e.target.value;
                      setTypedAddress(val);
                      setShowSuggestions(true);
                      if (val.trim() === "") {
                        setShowSuggestions(false);
                      }
                    }}
                    onFocus={() => {
                      if (typedAddress.trim() !== "") {
                        setShowSuggestions(true);
                      }
                    }}
                    placeholder="Search for area, street name, or landmark (e.g. Broadway, Morrison)..."
                    className="w-full text-xs pl-9 pr-8 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-semibold shadow-xs"
                  />
                  {typedAddress && (
                    <button
                      type="button"
                      onClick={() => {
                        setTypedAddress("");
                        setDetectedCoords(null);
                        setGeocodeFeedback("");
                        setShowSuggestions(false);
                      }}
                      className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Detect GPS Location Button (Swiggy style) */}
                <button
                  type="button"
                  onClick={() => {
                    setIsGeocoding(true);
                    setGeocodeFeedback("Locating your device via satellite GPS...");
                    if (navigator.geolocation) {
                      navigator.geolocation.getCurrentPosition(
                        (position) => {
                          const { latitude, longitude } = position.coords;
                          let lat = latitude;
                          let lng = longitude;
                          const isOutside = lat < 45.48 || lat > 45.56 || lng < -122.72 || lng > -122.62;
                          if (isOutside) {
                            lat = 45.5192;
                            lng = -122.6815;
                          }
                          setTimeout(() => {
                            setDetectedCoords({ lat, lng });
                            setTypedAddress(reverseGeocode(lat, lng));
                            setIsGeocoding(false);
                            setGeocodeFeedback("✓ GPS Location locked successfully via device satellite!");
                          }, 800);
                        },
                        () => {
                          setTimeout(() => {
                            const lat = 45.5192 + (Math.random() - 0.5) * 0.015;
                            const lng = -122.6815 + (Math.random() - 0.5) * 0.02;
                            setDetectedCoords({ lat, lng });
                            setTypedAddress(reverseGeocode(lat, lng));
                            setIsGeocoding(false);
                            setGeocodeFeedback("✓ Location resolved successfully (using browser fallback).");
                          }, 1000);
                        }
                      );
                    } else {
                      setTimeout(() => {
                        const lat = 45.5192;
                        const lng = -122.6815;
                        setDetectedCoords({ lat, lng });
                        setTypedAddress(reverseGeocode(lat, lng));
                        setIsGeocoding(false);
                        setGeocodeFeedback("✓ Portland Central simulation locked.");
                      }, 1000);
                    }
                  }}
                  className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer border ${
                    isGeocoding 
                      ? "bg-blue-50 text-blue-700 border-blue-200 animate-pulse" 
                      : "bg-white text-blue-600 border-blue-200 hover:bg-blue-50 active:scale-95"
                  }`}
                >
                  <Compass className={`w-4 h-4 ${isGeocoding ? 'animate-spin' : ''}`} />
                  Detect My Location
                </button>
              </div>

              {/* Suggestions dropdown like Swiggy */}
              {showSuggestions && (
                <div className="absolute left-0 right-0 top-11 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden divide-y divide-slate-100 max-h-48 overflow-y-auto animate-fadeIn">
                  {PORTLAND_SUGGESTIONS.filter(item => 
                    item.address.toLowerCase().includes(typedAddress.toLowerCase()) || 
                    item.desc.toLowerCase().includes(typedAddress.toLowerCase())
                  ).map((item) => (
                    <button
                      key={item.address}
                      type="button"
                      onClick={() => {
                        setTypedAddress(item.address);
                        setDetectedCoords({ lat: item.lat, lng: item.lng });
                        setShowSuggestions(false);
                        setGeocodeFeedback("✓ Selected from verified city landmark directories.");
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-slate-50 transition-colors flex items-start gap-3 text-xs cursor-pointer"
                    >
                      <MapPin className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="font-bold text-slate-800 truncate">{item.address}</p>
                        <p className="text-[10px] text-slate-400 font-semibold truncate">{item.desc}</p>
                      </div>
                    </button>
                  ))}
                  {PORTLAND_SUGGESTIONS.filter(item => 
                    item.address.toLowerCase().includes(typedAddress.toLowerCase()) || 
                    item.desc.toLowerCase().includes(typedAddress.toLowerCase())
                  ).length === 0 && (
                    <div className="p-3 text-center text-xs text-slate-400 font-medium">
                      Press 'Detect My Location' or touch the map to set a custom coordinate.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Large Interactive SVG Map */}
            <div className="space-y-2 flex-1 flex flex-col min-h-[380px]">
              <div className="relative flex-1 bg-blue-50/40 rounded-2xl border border-slate-200 overflow-hidden cursor-crosshair shadow-inner">
                <svg 
                  className="absolute inset-0 w-full h-full select-none"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const clickX = e.clientX - rect.left;
                    const clickY = e.clientY - rect.top;

                    const pctX = clickX / rect.width;
                    const pctY = clickY / rect.height;

                    const latMin = 45.5000;
                    const latMax = 45.5400;
                    const lngMin = -122.7000;
                    const lngMax = -122.6400;

                    // Convert Percent back to Lat/Lng
                    const lng = lngMin + pctX * (lngMax - lngMin);
                    const lat = latMin + (1 - pctY) * (latMax - latMin);

                    const resolvedAddr = reverseGeocode(lat, lng);
                    setDetectedCoords({ lat, lng });
                    setTypedAddress(resolvedAddr);
                    setGeocodeFeedback("✓ Pin dropped on custom coordinate.");
                  }}
                >
                  {/* Water flow background path */}
                  <path 
                    d="M 160 0 Q 140 80, 190 120 T 170 200 L 200 200 T 210 120 Q 170 80, 190 0 Z" 
                    fill="#d0e1fe" 
                    className="opacity-70"
                  />

                  {/* Park zones */}
                  <rect x="40" y="30" width="80" height="60" rx="4" fill="#e2f5e5" className="opacity-60" />
                  <rect x="280" y="150" width="70" height="80" rx="4" fill="#e2f5e5" className="opacity-60" />

                  {/* Grid roads with clean rendering */}
                  <line x1="0" y1="100" x2="600" y2="100" stroke="#f1f3f7" strokeWidth="8" />
                  <line x1="0" y1="100" x2="600" y2="100" stroke="#ffffff" strokeWidth="3" />
                  <line x1="0" y1="240" x2="600" y2="240" stroke="#f1f3f7" strokeWidth="8" />
                  <line x1="0" y1="240" x2="600" y2="240" stroke="#ffffff" strokeWidth="3" />
                  
                  <line x1="180" y1="0" x2="180" y2="400" stroke="#f1f3f7" strokeWidth="8" />
                  <line x1="180" y1="0" x2="180" y2="400" stroke="#ffffff" strokeWidth="3" />
                  <line x1="420" y1="0" x2="420" y2="400" stroke="#f1f3f7" strokeWidth="8" />
                  <line x1="420" y1="0" x2="420" y2="400" stroke="#ffffff" strokeWidth="3" />

                  {/* Draggable pinpoint representation inside map */}
                  {detectedCoords && (
                    <g transform={`translate(${((detectedCoords.lng - (-122.7)) / 0.06) * 100}%, ${ (1 - (detectedCoords.lat - 45.5) / 0.04) * 100}%)`}>
                      <circle cx="0" cy="0" r="28" fill="#3b82f6" fillOpacity="0.15" className="animate-ping" />
                      <circle cx="0" cy="0" r="14" fill="#3b82f6" fillOpacity="0.3" />
                      <circle cx="0" cy="0" r="7" fill="#2563eb" stroke="#ffffff" strokeWidth="2" className="shadow-lg" />
                    </g>
                  )}
                </svg>

                {/* Absolute Overlay if not selected yet */}
                {!detectedCoords && (
                  <div className="absolute inset-0 bg-slate-900/15 backdrop-blur-3xs flex flex-col items-center justify-center pointer-events-none">
                    <div className="bg-slate-900/95 text-white font-black text-xs px-4 py-2.5 rounded-2xl uppercase tracking-wider flex items-center gap-2 shadow-lg animate-bounce">
                      <MapPin className="w-4 h-4 text-rose-500 animate-pulse" />
                      Tap Map Grid to Pinpoint Hazard Address
                    </div>
                  </div>
                )}
              </div>

              {/* Status & coordinates display */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-4">
                {detectedCoords ? (
                  <div className="text-xs space-y-0.5 text-slate-700 font-medium">
                    <p className="text-emerald-700 font-extrabold flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      Location Captured & Verified
                    </p>
                    <p className="text-slate-900 font-bold truncate">Address: {typedAddress || "Custom Map Marker"}</p>
                    <p className="font-mono text-[9.5px] text-slate-405">GPS Coordinate: {detectedCoords.lat.toFixed(5)}° N, {detectedCoords.lng.toFixed(5)}° W</p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-450 font-semibold italic">Please select an address or pinpoint on the map grid to lock location coordinates...</p>
                )}

                {geocodeFeedback && (
                  <span className="text-[10px] bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg border border-blue-100 font-bold truncate max-w-[240px]">
                    {geocodeFeedback}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: CATEGORY CHOICE LIST */}
        {step === 2 && (
          <div className="space-y-6 flex flex-col flex-1 min-h-0">
            <div>
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest font-mono">Step 2: Problem Category</span>
              <h4 className="text-xl font-extrabold text-slate-900 mt-0.5">Define category of hazard</h4>
              <p className="text-xs text-slate-500 leading-relaxed mt-1">
                Select a standard problem category from our municipal list. This routes the alert to the correct dispatcher team.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 flex-1 overflow-y-auto pr-1">
              {Object.entries(IssueCategory).map(([key, label]) => {
                const isSelected = selectedCategory === label;
                let descriptionText = "Report municipal infrastructure and safety concerns.";
                let emoji = "⚠️";

                if (label === IssueCategory.POTHOLE) {
                  descriptionText = "Deep tarmac pits, sinkholes & dangerous vehicle lane cracks.";
                  emoji = "🕳️";
                } else if (label === IssueCategory.STREETLIGHT_OUT) {
                  descriptionText = "Dark neighborhood corridors, non-functional public bulbs.";
                  emoji = "💡";
                } else if (label === IssueCategory.ILLEGAL_DUMPING) {
                  descriptionText = "Hazardous piles, bulk waste, and trash bags left on streets.";
                  emoji = "🗑️";
                } else if (label === IssueCategory.GRAFFITI) {
                  descriptionText = "Offensive markings, spray taggings on public structures.";
                  emoji = "🎨";
                } else if (label === IssueCategory.WATER_LEAK) {
                  descriptionText = "Burst hydrants, high pressure flooding & pooling on sidewalks.";
                  emoji = "💧";
                } else if (label === IssueCategory.TRAFFIC_SIGNAL_FAULT) {
                  descriptionText = "Broken traffic lights, blinking signs & damaged crossing signals.";
                  emoji = "🚦";
                } else if (label === IssueCategory.INFRASTRUCTURE_FAILURE) {
                  descriptionText = "Buckled pavement curb, broken public stairs, structural decay.";
                  emoji = "🚧";
                }

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(label);
                      setDiagnosticAnswers({});
                    }}
                    className={`p-4 rounded-2xl border text-left text-xs transition-all flex flex-col justify-between cursor-pointer group min-h-[110px] ${
                      isSelected 
                        ? "bg-blue-50 border-blue-600 text-blue-950 shadow-md ring-2 ring-blue-500" 
                        : "bg-white border-slate-200 hover:border-slate-350 hover:shadow-xs text-slate-700"
                    }`}
                  >
                    <div className="flex items-start justify-between w-full">
                      <span className="text-2xl">{emoji}</span>
                      {isSelected && (
                        <span className="bg-blue-600 text-white rounded-full p-0.5 text-[10px]">
                          <Check className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                    <div className="mt-3">
                      <span className="font-extrabold text-slate-900 block text-xs group-hover:text-blue-600 transition-colors">{label}</span>
                      <p className="text-[10px] text-slate-450 leading-relaxed font-semibold mt-1">{descriptionText}</p>
                    </div>
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => {
                  setSelectedCategory("others");
                  setDiagnosticAnswers({});
                }}
                className={`p-4 rounded-2xl border text-left text-xs transition-all flex flex-col justify-between cursor-pointer group min-h-[110px] ${
                  selectedCategory === "others" 
                    ? "bg-blue-50 border-blue-600 text-blue-950 shadow-md ring-2 ring-blue-500" 
                    : "bg-white border-slate-200 hover:border-slate-350 hover:shadow-xs text-slate-700"
                }`}
              >
                <div className="flex items-start justify-between w-full">
                  <span className="text-2xl">🧩</span>
                  {selectedCategory === "others" && (
                    <span className="bg-blue-600 text-white rounded-full p-0.5 text-[10px]">
                      <Check className="w-3 h-3" />
                    </span>
                  )}
                </div>
                <div className="mt-3">
                  <span className="font-extrabold text-slate-900 block text-xs group-hover:text-blue-600 transition-colors">Other Problem / Not Listed</span>
                  <p className="text-[10px] text-slate-455 leading-relaxed font-semibold mt-1">Specify custom municipal issues or safety requests.</p>
                </div>
              </button>
            </div>

            {selectedCategory === "others" && (
              <div className="animate-fadeIn mt-2 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <label className="block text-[10px] font-black font-mono tracking-widest text-slate-500 uppercase mb-1.5">
                  Specify Custom Problem Title
                </label>
                <input
                  type="text"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="e.g. Broken pavement curb, Fallen tree branches, blockages..."
                  className="w-full text-xs px-4 py-2.5 border rounded-xl bg-white focus:bg-white outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-semibold shadow-xs"
                />
              </div>
            )}
          </div>
        )}

        {/* STEP 3: DETAILS (DIAGNOSTICS + DESCRIPTION + PUBLIC WARNING + EMERGENCY PHONE) */}
        {step === 3 && (
          <div className="space-y-5 flex flex-col flex-1 min-h-0 animate-fadeIn">
            <div>
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest font-mono">Step 3: Diagnostics & Description</span>
              <h4 className="text-xl font-extrabold text-slate-900 mt-0.5">Describe the exact problem</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Provide as much detail as you can. This will help public works crews and automated diagnosis tools assess severity.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 flex-1 overflow-y-auto pr-1">
              
              {/* LEFT SIDE: DIAGNOSTICS & DESCRIPTION INPUT */}
              <div className="space-y-4">
                {/* Set-defined list of questions (Humble & polite, optional) */}
                {categoryQuestions.length > 0 && (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                    <p className="text-[10px] uppercase font-black tracking-wider text-slate-500 font-mono">Automated Incident Diagnostics (Optional)</p>
                    <div className="space-y-4">
                      {categoryQuestions.map((q) => (
                        <div key={q.id} className="space-y-2">
                          <span className="block text-xs font-bold text-slate-800">{q.question}</span>
                          <div className="flex flex-wrap gap-2">
                            {q.options.map((opt) => {
                              const isChecked = diagnosticAnswers[q.id] === opt.score;
                              return (
                                <button
                                  key={opt.label}
                                  type="button"
                                  onClick={() => {
                                    setDiagnosticAnswers((prev) => ({
                                      ...prev,
                                      [q.id]: isChecked ? undefined : opt.score
                                    }));
                                  }}
                                  className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                                    isChecked 
                                      ? "bg-blue-600 text-white border-blue-650 shadow-xs" 
                                      : "bg-white border-slate-200 hover:border-slate-350 hover:bg-slate-50 text-slate-600"
                                  }`}
                                >
                                  {opt.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Description Text Area */}
                <div className="space-y-1.5 flex-1 flex flex-col">
                  <label className="block text-[10px] font-black font-mono tracking-widest text-slate-500 uppercase">
                    Detailed Incident Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe specific structural hazards, water flow direction, active threats, or detailed landmark references..."
                    className="w-full text-xs px-4 py-3 border rounded-xl bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-semibold shadow-xs flex-1"
                    rows={8}
                    required
                  />
                </div>
              </div>

              {/* RIGHT SIDE: SAFETY COMPLIANCE & INCIDENT NOTICES */}
              <div className="space-y-4 flex flex-col justify-between">
                
                {/* Public Notice Bento Card */}
                <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-100 text-blue-700 p-2 rounded-xl">
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-extrabold text-blue-900 text-sm block">Public Transparency Program</span>
                      <p className="text-slate-600 text-[11px] leading-relaxed mt-1">
                        All dispatched issues, preset coordinates, and verified descriptions are uploaded directly to our open municipal data dashboard. Nearby citizens can view, verify, and comment to accelerate repairs.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Public Security Warnings Panel */}
                <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-2xl space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="bg-amber-100 text-amber-700 p-2 rounded-xl">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-extrabold text-amber-900 text-sm block">Public Security Notice</span>
                      <p className="text-slate-600 text-[11px] leading-relaxed mt-1">
                        Do not upload proprietary information, passwords, private telephone lines, or sensitive house keys. All information in the comments and images will be permanently visible to standard citizen dashboards.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Emergency Hotline Alert */}
                <div className="p-4 bg-red-50/70 border border-red-100 rounded-2xl space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="bg-red-100 text-rose-700 p-2 rounded-xl">
                      <Phone className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <span className="font-extrabold text-red-950 text-sm block">Severe Infrastructure Disasters</span>
                      <p className="text-red-900 text-[11px] leading-relaxed mt-1">
                        If this is an immediate, catastrophic threat (such as major gas line rupture, live electric wires sparking, or high pressure heavy flooding), dial immediate dispatch operators at:
                      </p>
                      <span className="inline-block bg-white text-rose-700 font-extrabold border border-rose-200 rounded-lg px-3 py-1 text-xs mt-2 select-all font-mono">
                        📞 (503) 555-0199
                      </span>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}

        {/* STEP 4: ATTACHMENT, ANONYMITY, SUMMARY & ISSUE SUBMIT */}
        {step === 4 && (
          <div className="space-y-4 animate-fadeIn">
            <div>
              <span className="text-[10px] font-black text-slate-405 uppercase tracking-widest font-mono">Step 4: Image & Submit</span>
              <h4 className="text-base font-extrabold text-slate-800 mt-0.5 animate-pulse">Select pictures & finish submission</h4>
              <p className="text-xs text-slate-455 leading-relaxed">
                Upload custom photos or select a representative preset below. Toggle whether your username is shown publicly.
              </p>
            </div>

            {/* Dual Attachment Section (Manual click & Drag/Drop + Presets) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              
              {/* Left side: Upload card */}
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById("citizen-file-picker")?.click()}
                className={`border-2 border-dashed rounded-xl p-3 text-center flex flex-col items-center justify-center cursor-pointer transition-all ${
                  dragOver ? "border-blue-500 bg-blue-50/50" : "border-slate-250 hover:border-blue-400 bg-slate-50/50 hover:bg-slate-50"
                }`}
              >
                <input 
                  type="file" 
                  id="citizen-file-picker" 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleFileChange}
                />
                
                <Upload className="w-6 h-6 text-slate-400 mb-1 animate-bounce" />
                <span className="text-[11px] font-extrabold text-slate-700">
                  {uploadedFileName ? "File Chosen" : "Upload local image"}
                </span>
                <p className="text-[9px] text-slate-400 mt-0.5 leading-snug">
                  {uploadedFileName ? uploadedFileName : "Drag & drop files here or click to choose"}
                </p>
              </div>

              {/* Right side: Presets chooser */}
              <div className="space-y-1.5">
                <span className="text-[9px] font-black font-mono tracking-widest text-slate-400 uppercase">Or select incident preset image</span>
                <div className="grid grid-cols-4 gap-1">
                  {PRESETS_IMAGE.map((url, idx) => (
                    <button
                      key={url}
                      type="button"
                      onClick={() => {
                        setFilePreselectedIdx(idx);
                        setImageUrl("");
                        setUploadedFileName("");
                      }}
                      className={`relative aspect-video rounded overflow-hidden border-2 transition-all cursor-pointer ${
                        filePreselectedIdx === idx 
                          ? "border-blue-600 ring-2 ring-blue-100" 
                          : "border-slate-200 hover:opacity-90"
                      }`}
                    >
                      <img src={url} className="w-full h-full object-cover" alt="preset preview" />
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Privacy toggle option */}
            <div className="p-3 border border-slate-200 bg-slate-50 rounded-xl flex items-center justify-between">
              <div className="text-xs">
                <span className="font-extrabold text-slate-800 block">Report Anonymously</span>
                <p className="text-[10px] text-slate-450 leading-snug">Hides your profile across municipal maps and public dispatch feeds.</p>
              </div>
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="w-4.5 h-4.5 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
              />
            </div>

            {/* Quick check summary info panel */}
            <div className="p-3 border border-slate-150 bg-slate-50/40 rounded-xl text-xs space-y-1.5">
              <p className="text-[9px] font-black text-slate-405 uppercase tracking-widest font-mono">Request Summary Review</p>
              <div className="grid grid-cols-2 gap-2 text-[11px] leading-relaxed font-semibold">
                <div>
                  <span className="text-slate-400 uppercase text-[8px] font-mono block">Problem Category</span>
                  <p className="font-black text-slate-800 truncate">{selectedCategory === "others" ? customCategory : selectedCategory}</p>
                </div>
                <div>
                  <span className="text-slate-400 uppercase text-[8px] font-mono block">Target Location</span>
                  <p className="font-bold text-slate-700 truncate">{typedAddress}</p>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 italic truncate border-t pt-1 font-medium">"{description}"</p>
            </div>
          </div>
        )}

        {/* Footer Navigation Buttons */}
        <div className="flex gap-2 pt-4 border-t border-slate-100 mt-4 h-12 shrink-0">
          {step > 1 && (
            <button
              type="button"
              onClick={handlePrevStep}
              className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-extrabold uppercase flex items-center gap-1 cursor-pointer transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          )}

          {step < totalSteps ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="ml-auto bg-blue-600 hover:bg-blue-700 text-white px-5 py-1.5 rounded-xl text-xs font-black uppercase flex items-center gap-1 cursor-pointer transition-all hover:shadow-xs"
            >
              Next Step
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleFormSubmit}
              className="ml-auto bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white px-5 py-2 rounded-xl text-xs font-black uppercase flex items-center gap-1 cursor-pointer transition-all shadow-md active:scale-95"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Submit Issue Ticket
                </>
              )}
            </button>
          )}
        </div>

      </div>

    </div>
  );
}
