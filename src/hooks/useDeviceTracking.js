import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

export function useDeviceTracking() {
  const [deviceAlert, setDeviceAlert] = useState(null);
  
  useEffect(() => {
    const trackDevice = async () => {
      try {
        const sessionData = localStorage.getItem("shielddocs_session");
        if (!sessionData) return;
        
        const userData = JSON.parse(sessionData);
        // We will fetch the user to get up-to-date metadata
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) return;

        // Fetch current location/ip data
        const res = await fetch('https://ipapi.co/json/');
        const ipData = await res.json();
        
        if (ipData.error) throw new Error("Could not fetch IP data");

        const currentEntry = {
          ip: ipData.ip,
          city: ipData.city,
          region: ipData.region,
          country: ipData.country_name,
          device: navigator.userAgent,
          timestamp: new Date().toISOString()
        };

        const loginHistory = user.user_metadata?.loginHistory || [];
        
        if (loginHistory.length > 0) {
          const lastEntry = loginHistory[0];
          let isDifferentDevice = lastEntry.device !== currentEntry.device;
          let isDifferentLocation = lastEntry.city !== currentEntry.city || lastEntry.country !== currentEntry.country;

          if (isDifferentDevice || isDifferentLocation) {
            const timeDiffMs = new Date(currentEntry.timestamp) - new Date(lastEntry.timestamp);
            const diffMins = Math.floor(timeDiffMs / (1000 * 60));
            const diffHours = (diffMins / 60).toFixed(1);

            setDeviceAlert({
              message: `Unusual login detected!`,
              details: `Location changed from ${lastEntry.city} to ${currentEntry.city}. Device changed. Time since last login: ${diffHours} hours.`,
              isDifferentDevice,
              isDifferentLocation
            });
          }
        }

        // Only add to history if the IP or UserAgent actually changed to prevent spam
        const isSameAsLast = loginHistory.length > 0 && 
                             loginHistory[0].ip === currentEntry.ip && 
                             loginHistory[0].device === currentEntry.device;

        if (!isSameAsLast) {
          const newHistory = [currentEntry, ...loginHistory].slice(0, 10); // keep last 10
          await supabase.auth.updateUser({
            data: { loginHistory: newHistory }
          });
        }

      } catch (err) {
        console.error("Device tracking error:", err);
      }
    };

    trackDevice();
  }, []);

  return { deviceAlert, setDeviceAlert };
}
