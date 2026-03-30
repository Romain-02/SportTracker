import {TrainingRecurrenceFrequency} from "../../models/enums/TrainingRecurrenceFrequency";
import {WeatherCondition} from "../../models/enums/WeatherCondition";

export class UpgradeStatements {
  private weatherConditions: string = Object.values(WeatherCondition)
    .map((value) => `'${value}'`)
    .join(', ');

  private recurrenceFrequencies: string = Object.values(TrainingRecurrenceFrequency)
    .map((value) => `'${value}'`)
    .join(', ');

  public upgrades = [
    {
      toVersion: 35,
      statements: [
        `DROP TABLE IF EXISTS ProgramSport;`,
        `DROP TABLE IF EXISTS StaminaSession;`,
        `DROP TABLE IF EXISTS StaminaTraining;`,
        `DROP TABLE IF EXISTS SportType;`,
        `DROP TABLE IF EXISTS Program;`,
        `DROP TABLE IF EXISTS Sport;`,
        `CREATE TABLE IF NOT EXISTS Sport (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          logo TEXT NOT NULL
        );`,
        `CREATE TABLE IF NOT EXISTS Program (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          description TEXT,
          startDate TEXT,
          endDate TEXT,
          isArchived INTEGER NOT NULL DEFAULT 0 CHECK(isArchived IN (0,1))
        );`,
        `CREATE TABLE IF NOT EXISTS SportType (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          sportId INTEGER NOT NULL,
          FOREIGN KEY (sportId) REFERENCES Sport(id)
        );`,
        `CREATE TABLE IF NOT EXISTS StaminaTraining (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT,
          predictedTime INTEGER CHECK(predictedTime IS NULL OR predictedTime >= 0),
          predictedKilometers REAL CHECK(predictedKilometers IS NULL OR predictedKilometers >= 0),
          predictedDifficulty INTEGER CHECK(predictedDifficulty IS NULL OR (predictedDifficulty >= 0 AND predictedDifficulty <= 10)),
          predictedWarmupTime INTEGER CHECK(predictedWarmupTime >= 0),
          predictedWarmupKilometers INTEGER CHECK(predictedWarmupKilometers >= 0),
          isActive BOOLEAN NOT NULL DEFAULT 1 CHECK(isActive IN (0,1)),
          sportId INTEGER NOT NULL,
          sportTypeId INTEGER,
          programId INTEGER,
          recurrenceDays TEXT,
          recurrenceFrequency TEXT CHECK(recurrenceFrequency IN (${this.recurrenceFrequencies})),
          FOREIGN KEY (sportId) REFERENCES Sport(id),
          FOREIGN KEY (programId) REFERENCES Program(id),
          FOREIGN KEY (sportTypeId) REFERENCES SportType(id)
        );`,
        `CREATE TABLE IF NOT EXISTS StaminaSession (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          label TEXT,
          createdAt TEXT NOT NULL DEFAULT (datetime('now','localtime')),
          realTime INTEGER CHECK(realTime >= 0),
          realDifficulty INTEGER CHECK(realDifficulty >= 0 AND realDifficulty <= 10),
          realKilometers REAL CHECK(realKilometers >= 0),
          predictedTime INTEGER CHECK(predictedTime IS NULL OR predictedTime >= 0),
          predictedDifficulty INTEGER CHECK(predictedDifficulty IS NULL OR (predictedDifficulty >= 0 AND predictedDifficulty <= 10)),
          predictedKilometers REAL CHECK(predictedKilometers IS NULL OR predictedKilometers >= 0),
          predictedWarmupTime INTEGER CHECK(predictedWarmupTime >= 0),
          predictedWarmupKilometers INTEGER CHECK(predictedWarmupKilometers >= 0),
          realWarmupTime INTEGER CHECK(realWarmupTime >= 0),
          realWarmupKilometers INTEGER CHECK(realWarmupKilometers >= 0),
          date TEXT,
          weatherCondition TEXT CHECK(weatherCondition IN (${this.weatherConditions})),
          staminaTrainingId INTEGER,
          programId INTEGER,
          sportId INTEGER,
          sportTypeId INTEGER,
          realised BOOLEAN NOT NULL DEFAULT 0 CHECK(realised IN (0,1)),
          FOREIGN KEY (staminaTrainingId) REFERENCES StaminaTraining(id),
          FOREIGN KEY (programId) REFERENCES Program(id),
          FOREIGN KEY (sportId) REFERENCES Sport(id),
          FOREIGN KEY (sportTypeId) REFERENCES SportType(id)
        );`,
        `CREATE TABLE IF NOT EXISTS ProgramSport (
          sportId INTEGER,
          programId INTEGER,
          PRIMARY KEY (sportId, programId),
          FOREIGN KEY (sportId) REFERENCES Sport(id),
          FOREIGN KEY (programId) REFERENCES Program(id)
        );`,
        `INSERT INTO Sport (name, logo) VALUES ('Course', '/assets/images/running.png'), ('Velo', '/assets/images/bicycle.png'), ('Marche', '/assets/images/walk.png');`,
        `INSERT INTO SportType (name, sportId) VALUES ('Sprint', (SELECT id FROM Sport WHERE name='Course')), ('Endurance', (SELECT id FROM Sport WHERE name='Course')), ('Fractionne', (SELECT id FROM Sport WHERE name='Course'));`,
        `INSERT INTO SportType (name, sportId) VALUES ('Velo de course', (SELECT id FROM Sport WHERE name='Velo')), ('VTT', (SELECT id FROM Sport WHERE name='Velo'));`
      ]
    },
  ];
}
