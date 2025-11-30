import React, { useEffect, useState, createContext, useContext } from "react";
import {
  Box,
  Button,
  Container,
  Flex,
  Input,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
  Stack,
  Text,
  DialogActionTrigger,
} from "@chakra-ui/react";

// ========== Interfaces ==========
interface Todo {
  id: string;
  item: string;
}

interface TodosContextType {
  todos: Todo[];
  fetchTodos: () => void;
}

interface UpdateTodoProps {
  item: string;
  id: string;
  fetchTodos: () => void;
}

interface TodoHelperProps {
  item: string;
  id: string;
  fetchTodos: () => void;
}

// ========== Context ==========
const TodosContext = createContext<TodosContextType>({
  todos: [],
  fetchTodos: () => {},
});

// ========== ADD TODO ==========
function AddTodo() {
  const [item, setItem] = React.useState("");
  const { todos, fetchTodos } = React.useContext(TodosContext);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const newTodo = { id: (todos.length + 1).toString(), item };

    await fetch("http://localhost:8000/todo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newTodo),
    });

    fetchTodos();
    setItem("");
  };

  return (
    <form onSubmit={handleSubmit}>
      <Input
        pr="4.5rem"
        type="text"
        placeholder="Add a todo item"
        aria-label="Add a todo item"
        onChange={(e) => setItem(e.target.value)}
        value={item}
      />
    </form>
  );
}

// ========== UPDATE TODO ==========
function UpdateTodo({ item, id, fetchTodos }: UpdateTodoProps) {
  const [todo, setTodo] = useState(item);

  const updateTodo = async () => {
    await fetch(`http://localhost:8000/todo/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ item: todo }),
    });
    await fetchTodos();
  };

  return (
    <DialogRoot>
      <DialogTrigger asChild>
        <Button ml="1" size="sm">
          Update
        </Button>
      </DialogTrigger>
      <DialogContent
        position="fixed"
        top="50%"
        left="50%"
        transform="translate(-50%, -50%)"
        p={6}
        rounded="md"
        shadow="lg"
        bg="white"
        zIndex={1000}
      >
        <DialogHeader>
          <DialogTitle>Update Todo</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <Input
            mt="4"
            type="text"
            placeholder="Edit todo item"
            aria-label="Edit todo item"
            onChange={(e) => setTodo(e.target.value)}
            value={todo}
          />
        </DialogBody>
        <DialogFooter>
          <DialogActionTrigger asChild>
            <Button variant="outline" size="sm">
              Cancel
            </Button>
          </DialogActionTrigger>
          <Button size="sm" ml="2" onClick={updateTodo}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  );
}

// ========== TODO HELPER ==========
function TodoHelper({ item, id, fetchTodos }: TodoHelperProps) {
  // ✅ Nueva función DELETE
  const deleteTodo = async () => {
    await fetch(`http://localhost:8000/todo/${id}`, {
      method: "DELETE",
    });
    fetchTodos();
  };

  return (
    <Box p={3} shadow="sm" borderWidth="1px" borderRadius="md">
      <Flex justify="space-between" align="center">
        <Text fontWeight="medium">{item}</Text>
        <Flex gap={2}>
          <UpdateTodo item={item} id={id} fetchTodos={fetchTodos} />
          <Button
            colorScheme="red"
            size="sm"
            variant="outline"
            onClick={deleteTodo}
          >
            Delete
          </Button>
        </Flex>
      </Flex>
    </Box>
  );
}

// ========== MAIN COMPONENT ==========
export default function Todos() {
  const [todos, setTodos] = useState<Todo[]>([]);

  const fetchTodos = async () => {
    const response = await fetch("http://localhost:8000/todo");
    const todos = await response.json();
    setTodos(todos.data);
  };

  useEffect(() => {
    fetchTodos();
  }, []);

  return (
    <TodosContext.Provider value={{ todos, fetchTodos }}>
      <Container maxW="container.xl" pt="100px">
        <AddTodo />
        <Stack gap={5} pt={5}>
          {todos.map((todo) => (
            <TodoHelper
              key={todo.id}
              item={todo.item}
              id={todo.id}
              fetchTodos={fetchTodos}
            />
          ))}
        </Stack>
      </Container>
    </TodosContext.Provider>
  );
}
