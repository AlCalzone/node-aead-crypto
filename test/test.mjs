import {sum} from "../index.js";
import test from "ava";

test("sum", t => {
	  t.is(sum(1, 2), 3);
});