import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import DialogBox from "@/components/DialogBox";
import { useStacks } from "@/hooks/useStacks";
import { useEffect, useState } from "react";
import { ExternalLink, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoaderOne } from "@/components/ui/loader";
import { useNavigate } from "react-router-dom";

function Homepage() {
  const { fetchStacks, stacks, isLoading, deleteStack } = useStacks();
  const [deleteLoaderId, setDeleteLoaderId] = useState(NaN);
  const navigate = useNavigate();
  const handleDelete = async (id: number) => {
    setDeleteLoaderId(id);
    await deleteStack(id);
    setDeleteLoaderId(NaN);
    await fetchStacks();
  };
  useEffect(() => {
    const loadStacks = async () => {
      console.log("Calling fetchStacks...");
      await fetchStacks();
      console.log("fetchStacks has finished.");
    };

    loadStacks();
  }, [fetchStacks]);
  return (
    <div className="min-h-[90vh] flex flex-col gap-8 p-8">
      {isLoading ? (
        <div className="flex-grow flex items-center justify-center">
          <LoaderOne />
        </div>
      ) : (
        <>
          <div className="flex justify-between border-b-2 pb-4">
            <div className="font-bold text-xl">My Stacks</div>
            <DialogBox onStackCreated={fetchStacks} />
          </div>

          {!stacks.length ? (
            <div className="flex-grow flex items-center justify-center">
              <Card className="w-96 bg-white">
                <CardHeader>
                  <CardTitle>Create New Stack</CardTitle>
                  <CardDescription>
                    Start building your generative AI apps with our essential
                    tools and frameworks
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <DialogBox onStackCreated={fetchStacks} />
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="grid grid-cols-1 self-center sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
              {stacks.map((stack) => (
                <Card key={stack.id} className="w-[311px] bg-white">
                  <CardHeader className="">
                    <div className="flex justify-between">
                      <CardTitle>{stack.name}</CardTitle>
                      {deleteLoaderId === stack.id ? (
                        <Loader2 className="w-6 h-6 animate-spin text-red-500 p-1 hover:bg-gray-100 hover:rounded-4xl" />
                      ) : (
                        <button onClick={() => handleDelete(stack.id)}>
                          <Trash2 className="w-6 h-6 text-red-500 cursor-pointer p-1 hover:bg-gray-100 hover:rounded-4xl" />
                        </button>
                      )}
                    </div>
                    <CardDescription>{stack.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex justify-end">
                    <Button
                      onClick={() => navigate(`/${stack.id}`)}
                      className="cursor-pointer hover:bg-white"
                      variant="outline"
                    >
                      <span>Edit Stack</span> <ExternalLink />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Homepage;
