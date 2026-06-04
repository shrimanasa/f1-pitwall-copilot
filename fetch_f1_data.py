"""
PitWall Core — Real F1 Data Fetcher
Pulls Monaco 2024 race data using FastF1
Run: python fetch_f1_data.py
Output: public/f1_data.json
"""

import fastf1
import fastf1.plotting
import pandas as pd
import json
import os
import random
from datetime import datetime

# Enable cache
fastf1.Cache.enable_cache('f1_cache')

print("Loading Monaco 2024 Race data...")
print("This may take 2-3 minutes on first run...")

# Load session with laps only
session = fastf1.get_session(2023, 'Monaco', 'R')
session.load()

print(f"Session loaded: {session.event['EventName']}")

# Get laps dataframe
laps = session.laps.copy()
print(f"Total laps in dataset: {len(laps)}")

all_drivers = laps['Driver'].unique().tolist()
print(f"Drivers found: {all_drivers}")

# Pick top 5 or whatever is available
TARGET_DRIVERS = ['VER', 'LEC', 'NOR', 'PIA', 'SAI']
DRIVERS = [d for d in TARGET_DRIVERS if d in all_drivers]
if not DRIVERS:
    DRIVERS = all_drivers[:5]
print(f"Using drivers: {DRIVERS}")

output = {
    "session": {
        "year": 2024,
        "race": "Monaco Grand Prix",
        "circuit": "Circuit de Monaco",
        "total_laps": 78,
        "generated_at": datetime.now().isoformat(),
    },
    "drivers": {},
    "pit_stops": [],
    "lap_data": [],
    "radio_intercepts": [],
}

# ── Per-driver lap data ────────────────────────────────────────────────────────
for drv in DRIVERS:
    try:
        drv_laps = laps[laps['Driver'] == drv].copy().reset_index(drop=True)
        if drv_laps.empty:
            print(f"  No laps for {drv}, skipping")
            continue

        lap_records = []
        for i, lap in drv_laps.iterrows():
            try:
                lt = lap['LapTime'].total_seconds() if pd.notna(lap['LapTime']) else None
                s1 = lap['Sector1Time'].total_seconds() if pd.notna(lap['Sector1Time']) else None
                s2 = lap['Sector2Time'].total_seconds() if pd.notna(lap['Sector2Time']) else None
                s3 = lap['Sector3Time'].total_seconds() if pd.notna(lap['Sector3Time']) else None
                compound = str(lap['Compound']) if pd.notna(lap['Compound']) else 'UNKNOWN'
                tyre_life = int(lap['TyreLife']) if pd.notna(lap['TyreLife']) else 0
                stint = int(lap['Stint']) if pd.notna(lap['Stint']) else 1
                lap_num = int(lap['LapNumber'])

                # Calculate tyre deg and grip from real tyre life
                deg_rate = {'SOFT': 3.5, 'MEDIUM': 2.2, 'HARD': 1.4, 'INTERMEDIATE': 1.8, 'WET': 1.2}
                rate = deg_rate.get(compound, 2.0)
                tyre_deg = min(95, round(tyre_life * rate, 1))
                grip_level = max(40, round(100 - tyre_deg * 0.72, 1))

                pit_in = False
                pit_out = False
                try:
                    pit_in = pd.notna(lap['PitInTime'])
                    pit_out = pd.notna(lap['PitOutTime'])
                except Exception:
                    pass

                lap_records.append({
                    "lap": lap_num,
                    "lap_time": round(lt, 3) if lt else None,
                    "sector1": round(s1, 3) if s1 else None,
                    "sector2": round(s2, 3) if s2 else None,
                    "sector3": round(s3, 3) if s3 else None,
                    "compound": compound,
                    "tyre_life": tyre_life,
                    "tyre_deg": tyre_deg,
                    "grip_level": grip_level,
                    "stint": stint,
                    "pit_in": bool(pit_in),
                    "pit_out": bool(pit_out),
                })

                # Record pit stop
                if pit_in:
                    output["pit_stops"].append({
                        "driver": drv,
                        "lap": lap_num,
                        "compound": compound,
                        "tyre_life_at_stop": tyre_life,
                        "tyre_deg_at_stop": tyre_deg,
                    })

            except Exception as e:
                continue

        # Best lap time
        valid = [r for r in lap_records if r['lap_time']]
        best = min(valid, key=lambda x: x['lap_time'])['lap_time'] if valid else None

        # Team name
        team = 'Unknown'
        try:
            team = str(drv_laps.iloc[0]['Team'])
        except Exception:
            pass

        output["drivers"][drv] = {
            "abbreviation": drv,
            "team": team,
            "best_lap_time": best,
            "total_laps": len(lap_records),
            "laps": lap_records,
        }
        pit_count = len([r for r in lap_records if r['pit_in']])
        print(f"  ✓ {drv} — {len(lap_records)} laps, {pit_count} pit stops, best: {best}s")

    except Exception as e:
        print(f"  ✗ {drv} error: {e}")
        continue

# ── Lap snapshots ──────────────────────────────────────────────────────────────
print("Building lap snapshots...")
try:
    max_lap = int(laps['LapNumber'].max())
    for lap_num in range(1, min(79, max_lap + 1)):
        snapshot = {"lap": lap_num, "drivers": {}}
        for drv in DRIVERS:
            if drv not in output["drivers"]:
                continue
            drv_lap = next((r for r in output["drivers"][drv]["laps"] if r["lap"] == lap_num), None)
            if drv_lap:
                snapshot["drivers"][drv] = {
                    "lap_time": drv_lap["lap_time"],
                    "compound": drv_lap["compound"],
                    "tyre_life": drv_lap["tyre_life"],
                    "tyre_deg": drv_lap["tyre_deg"],
                    "grip_level": drv_lap["grip_level"],
                    "stint": drv_lap["stint"],
                    "pit_in": drv_lap["pit_in"],
                }
        output["lap_data"].append(snapshot)
    print(f"  ✓ {len(output['lap_data'])} lap snapshots")
except Exception as e:
    print(f"  Lap snapshots error: {e}")

# ── Radio intercepts ───────────────────────────────────────────────────────────
print("Generating radio intercepts from real pit data...")
random.seed(42)

STRATEGISTS = {
    'VER': ('LAMBIASE', 'Red Bull'),
    'LEC': ('XAVI', 'Ferrari'),
    'NOR': ('STELLE', 'McLaren'),
    'PIA': ('DESIMONE', 'McLaren'),
    'SAI': ('FERRARI WALL', 'Ferrari'),
}

BLUFFS_STAY_OUT = [
    {"text": "We're staying out, no pit this lap.", "flagged": True, "deceptionType": "STAY_OUT_DECEPTION", "bluffProbability": 0.89},
    {"text": "Box not planned. Focus on the gap ahead.", "flagged": True, "deceptionType": "STAY_OUT_DECEPTION", "bluffProbability": 0.72},
    {"text": "Negative on the box, keep pushing.", "flagged": True, "deceptionType": "STAY_OUT_DECEPTION", "bluffProbability": 0.81},
    {"text": "No pit window open. Maintain pace.", "flagged": True, "deceptionType": "STAY_OUT_DECEPTION", "bluffProbability": 0.76},
]

BLUFFS_TYRE = [
    {"text": "I have no grip! We need to box!", "flagged": True, "deceptionType": "TYRE_CONDITION_BLUFF", "bluffProbability": 0.94},
    {"text": "Tyres are completely gone, struggling everywhere.", "flagged": True, "deceptionType": "TYRE_CONDITION_BLUFF", "bluffProbability": 0.78},
    {"text": "Can't push anymore, tyres are dead.", "flagged": True, "deceptionType": "TYRE_CONDITION_BLUFF", "bluffProbability": 0.85},
]

GENUINE = [
    {"text": "Tyres feeling good, pushing hard.", "flagged": False, "deceptionType": None, "bluffProbability": 0.08},
    {"text": "Front left is starting to go.", "flagged": False, "deceptionType": None, "bluffProbability": 0.14},
    {"text": "Gap is stable, maintaining pace.", "flagged": False, "deceptionType": None, "bluffProbability": 0.06},
    {"text": "Engine clipping slightly at turn 8.", "flagged": False, "deceptionType": None, "bluffProbability": 0.09},
    {"text": "DRS not deploying correctly.", "flagged": False, "deceptionType": None, "bluffProbability": 0.07},
    {"text": "Brakes feel good through the chicane.", "flagged": False, "deceptionType": None, "bluffProbability": 0.05},
]

iid = 0
for pit in output["pit_stops"]:
    drv = pit["driver"]
    pit_lap = pit["lap"]
    strat_name, team = STRATEGISTS.get(drv, (drv, 'Unknown'))

    # Stay-out bluff 2 laps before pit
    if pit_lap > 2:
        t = random.choice(BLUFFS_STAY_OUT)
        output["radio_intercepts"].append({
            "id": iid, "lap": pit_lap - 2,
            "src": strat_name, "team": team, "driver": drv,
            **t, "graniteReasoning": None, "analyzing": False,
        })
        iid += 1

    # Tyre bluff 1 lap before (60% chance)
    if random.random() > 0.4 and pit_lap > 1:
        t = random.choice(BLUFFS_TYRE)
        output["radio_intercepts"].append({
            "id": iid, "lap": pit_lap - 1,
            "src": drv, "team": team, "driver": drv,
            **t, "graniteReasoning": None, "analyzing": False,
        })
        iid += 1

    # Genuine message mid-stint
    t = random.choice(GENUINE)
    output["radio_intercepts"].append({
        "id": iid, "lap": max(1, pit_lap - 5),
        "src": drv, "team": team, "driver": drv,
        **t, "graniteReasoning": None, "analyzing": False,
    })
    iid += 1

# Sort by lap number
output["radio_intercepts"].sort(key=lambda x: x["lap"])
print(f"  ✓ {len(output['radio_intercepts'])} radio intercepts generated")

# ── Write output ───────────────────────────────────────────────────────────────
os.makedirs('public', exist_ok=True)
with open('public/f1_data.json', 'w') as f:
    json.dump(output, f, indent=2, default=str)

print(f"\n✅ Done! Written to public/f1_data.json")
print(f"   Drivers:         {list(output['drivers'].keys())}")
print(f"   Pit stops:       {len(output['pit_stops'])}")
print(f"   Lap snapshots:   {len(output['lap_data'])}")
print(f"   Radio intercepts:{len(output['radio_intercepts'])}")
print(f"\nYour dashboard will load this from /f1_data.json")