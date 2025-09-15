# Sample Proctoring Report

## Candidate & Exam Details
- **Candidate:** Jordan Smith
- **Candidate ID:** STU-48319
- **Exam:** Advanced Calculus Final Assessment
- **Examiner:** Prof. Elena Ruiz
- **Scheduled Date:** 12 July 2024
- **Session Start:** 12 July 2024, 09:02:15 (UTC)
- **Session End:** 12 July 2024, 10:34:48 (UTC)
- **Total Duration:** 1 h 32 min 33 s

## System & Environment Checks
| Check | Result | Notes |
| --- | --- | --- |
| Camera access | Pass | 1080p stream detected at 30 FPS |
| Microphone access | Pass | Input level nominal |
| Network quality | Pass | Average latency 48 ms, no packet loss |
| Browser compatibility | Pass | Chrome 124 on Windows 11 |
| Room scan | Pass | Single occupant, workstation clear at launch |

## Attendance & Focus Summary
- Face detected for **94%** of active session time.
- Candidate gaze remained centered for **88%** of monitored frames.
- No extended absences recorded.

## Detected Events
| Timestamp (UTC) | Category | Severity | Description | System Action |
| --- | --- | --- | --- | --- |
| 09:12:04 | Focus | Medium | Candidate looked away to the left for approximately 6 seconds. | Event logged; proctor notified via dashboard badge. |
| 09:27:51 | Object | High | Suspicious item identified: **cell phone** with 87% confidence. | Screenshot captured; alert pushed to live proctor queue. |
| 09:27:58 | Audio | Medium | Secondary voice detected in proximity of microphone. | Marker added to recording for manual review. |
| 09:56:33 | Focus | Low | Candidate leaned out of frame for 4 seconds; no further action. | Event logged only. |
| 10:18:09 | Network | Low | Brief bandwidth dip (upload 200 kbps for 12 s). | System automatically reduced video bitrate. |

## Visual Evidence Summary
- **Screenshots Captured:** 3 (available in Storage bucket `recordings/2024-07-12/STU-48319/`).
- **Session Recording:** `recordings/STU-48319-20240712.webm` (duration 01:32:33, size 428 MB).
- **Face Detection Overlay:** Enabled throughout session.

## Audio & Transcript Notes
- Automatic speech detection flagged a second speaker at 09:27:58; confidence 0.68.
- No keyword matches from restricted terms list.

## Proctor Notes
> Candidate appeared compliant after initial phone alert; placed device face down and returned focus to the screen. No further anomalies observed.

## Recommended Follow-up
1. Review screenshot and video segment around **09:27** to confirm presence of mobile device.
2. Verify audio snippet at **09:27:58** for possible third-party assistance.
3. If violations are confirmed, escalate to academic integrity board with supporting media.

## Compliance Checklist
- [x] Identity verified against government-issued ID.
- [x] Room scan completed and recorded.
- [x] Candidate acknowledged exam rules.
- [ ] Incident ticket filed (pending post-review).

## Session Metadata
```json
{
  "sessionId": "sess_72a948a1",
  "firebase": {
    "sessionDoc": "sessions/sess_72a948a1",
    "recordingPath": "recordings/STU-48319-20240712.webm",
    "eventsCollection": "sessions/sess_72a948a1/events"
  },
  "systemInfo": {
    "browser": "Chrome/124.0.6367.158",
    "os": "Windows 11 23H2",
    "viewport": { "width": 1920, "height": 1080 },
    "video": { "width": 1280, "height": 720 }
  }
}
```

---
**Prepared by:** Automated Focus Proctoring System 2.4.1

**Generated on:** 12 July 2024, 10:35:10 (UTC)
