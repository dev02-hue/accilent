import React from 'react';
import Translate from './Translate';

const TranslateBody = () => {
  return (
    <div className="
      w-screen max-w-[100vw]   
        px-2   
      mt-12  
      flex items-center justify-center
      shadow-md   
      rounded-md  
      transition-all duration-300
      min-h-[60px]   
      -mx-2   
    ">
      <div className="
        w-full 
        max-w-[280px]  
        xs:max-w-[300px]   
        sm:max-w-none  
        sm:w-full
        flex flex-col  
        items-center
        justify-center
        gap-3   
      ">
        <div className="w-full flex justify-center">
          <Translate 
              /* Optional: Add scale prop to Translate */
          />
        </div>
        
        {/* Optional label - hidden on smallest screens */}
        <span className="
          text-white
          text-xs  /* Extra small text */
          xs:text-sm  /* Slightly larger when possible */
          font-medium
          hidden  /* Hidden by default */
          xs:block  /* Show on 320px+ */
          text-center
          whitespace-nowrap  /* Prevent text wrapping */
        ">
          Language Selector
        </span>
      </div>
    </div>
  );
};

export default TranslateBody;