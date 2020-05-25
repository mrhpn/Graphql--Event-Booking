const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const express = require("express");
const bodyParser = require("body-parser");
const graphqlHttp = require("express-graphql");
const { buildSchema } = require("graphql");
const app = express();

const Event = require("./models/event");
const User = require("./models/user");

app.use(bodyParser.json());

app.use(
  "/graphql",
  graphqlHttp({
    schema: buildSchema(`
		type Event {
			_id: ID!
			title: String!
			description: String!
			price: Float!
			date: String!
			creator: User
		}

		type User {
			_id: ID!
			name: String!
			email: String!
			password: String
			createdEvents: [Event!]
		}

		input EventInput {
			title: String!
			description: String!
			price: Float!
			date: String!
		}

		input UserInput {
			name: String!
			email: String!
			password: String!
		}

		type RootQuery {
			events: [Event!]!
		}

		type RootMutation {
			createEvent(eventInput: EventInput): Event
			createUser(userInput: UserInput): User
		}

		schema {
			query: RootQuery
			mutation: RootMutation
		}
	`),
    rootValue: {
      events: () => {
        return Event.find()
          .populate("creator")
          .then((events) => {
            return events.map((event) => {
              return {
                ...event._doc,
                _id: event.id,
                creator: {
                  ...event._doc.creator._doc,
                  _id: event._doc.creator.id,
                },
              };
            });
          })
          .catch((err) => {
            throw err;
          });
      },
      createEvent: (args) => {
        const event = new Event({
          title: args.eventInput.title,
          description: args.eventInput.description,
          price: +args.eventInput.price,
          date: new Date(args.eventInput.date),
          creator: "5ecbdea0edc51a2b98ff57d4",
        });

        let createdEvent;

        return event
          .save()
          .then((result) => {
            createdEvent = { ...result._doc, _id: result.id };
            return User.findById("5ecbdea0edc51a2b98ff57d4");
          })
          .then((user) => {
            console.log(user);
            if (!user) {
              throw new Error("User not found.");
            }
            user.createdEvents.push(event);
            return user.save();
          })
          .then((result) => {
            return createdEvent;
          })
          .catch((err) => {
            console.log(err);
            throw err;
          });
      },
      createUser: (args) => {
        return User.find({ email: args.userInput.email })
          .then((user) => {
            if (user.length === 1) {
              throw new Error("User already exists.");
            }

            return bcrypt.hash(args.userInput.password, 12);
          })
          .then((hashedPassword) => {
            const user = new User({
              name: args.userInput.name,
              email: args.userInput.email,
              password: hashedPassword,
            });

            return user.save();
          })
          .then((result) => {
            return { ...result._doc, _id: result.id, password: null };
          })
          .catch((err) => {
            throw err;
          });
      },
    },
    graphiql: true,
  })
);

mongoose
  .connect("mongodb://localhost:27017/event-booking-api-graphql", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to the database...");
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`Listening on port ${PORT}...`));
  })
  .catch((err) => console.log(err));
