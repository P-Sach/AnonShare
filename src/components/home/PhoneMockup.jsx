function PhoneMockup() {
  return (
    <svg width="300" height="480" viewBox="0 0 300 480" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Phone frame (updated height to 430) */}
      <rect x="50" y="20" width="200" height="430" rx="30" fill="#333" />
      
      {/* Screen area (adjusted for new frame size) */}
      <foreignObject x="60" y="40" width="180" height="390" rx="20">
        <div xmlns="http://www.w3.org/1999/xhtml" style={{
          width: '100%',
          height: '100%',
          borderRadius: '20px',
          overflow: 'hidden',
          position: 'relative'
        }}>
          {/* App screenshot image */}
          <img 
            src="src/assets/react.svg" 
            alt="App screenshot"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: 'brightness(0.9)'
            }}
          />
          {/* Glass overlay effect */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(1px)'
          }} />
        </div>
      </foreignObject>
      
      {/* Phone details (adjusted positions) */}
      <rect x="120" y="30" width="60" height="10" rx="5" fill="#111" />
    </svg>
  );
}

export default PhoneMockup;