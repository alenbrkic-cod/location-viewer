# Location

See the location history recorded by the Möbius phone app in one place: a
track map and a timeline of recent fixes, grouped into sessions.

- The map plots every recorded fix, connected into a track per session, with
  your latest position highlighted. Drag to pan; pinch, scroll, or use the
  buttons to zoom. Map background tiles come from OpenStreetMap, fetched
  through your Möbius instance, so OpenStreetMap sees which map area is shown
  but your recorded positions are never sent to any outside service.
- The timeline lists recent fixes with time, accuracy, speed, and altitude when
  available, plus a "Map" link that opens that one point on the OpenStreetMap
  website.
- Shows whether tracking is on or off and how often a point is recorded.
  Tracking is turned on and off in the Möbius app on your phone.

Reads the owner's positions from `GET /api/location/positions` and the tracking
status from `GET /api/location/tracking`, which requires the
`location_history_read` permission.
