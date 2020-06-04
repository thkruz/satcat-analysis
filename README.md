# satcat-analysis
This project was used for the backend of a Space Force tool called SPADE. The intent was to propogate TLEs, generate FOV details, and then create XML and CSV files that can be imported into Microsoft Access or used standalone.

# Notes
<!-- saved from url=(0014)about:internet --> is required to allow running the scripts from a local machine without generating activeX warnings.
"rise" is either 0 = first line of coverage or 1 = last line of coverage.
"margF" is any pass with a slant range of less than 750km.
"margE" is any pass that fails to exceed 4° of elevation.
"margT" is any pass that fails to exceed 3 minutes of time in coverage. NOTE: The FOV of used in the script is expanded to ensure nothing is missed.
"farP" is any pass where the minimum slant range exceeds 2750km.
"fenceT" is either 0 = horizantal or 1 = vertical.
"nkFence" is any pass that begins above 3° of elevation.
