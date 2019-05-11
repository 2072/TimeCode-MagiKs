TODO
====

29.976 / 23.976 implementation
------------------------------


23.976 is alays Non Drop Frame, timecode are represented the same as 24fps.
It's the duration of the second that changes instead.

29.976 behaves the same in NDF but is a PITA in DF mode...

For NDF there is still the conversion to other framerate to consider:
our basis is always the frame, every TC is converted to its frame number
representation so this non integer framerate should not be an issue.

We must add conversion on input, a special case unfortunately...

