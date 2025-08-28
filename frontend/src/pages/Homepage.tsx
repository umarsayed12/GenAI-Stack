import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import DialogBox from "@/components/DialogBox";

function Homepage() {
  return (
    <div className="min-h-[90vh] flex flex-col p-8">
      <div className="flex justify-between border-b-2 pb-4">
        <div className="font-bold text-xl">My Stacks</div>
        <DialogBox />
      </div>

      <div className="flex-grow flex items-center justify-center">
        <Card className="w-96 bg-white">
          <CardHeader>
            <CardTitle>Create New Stack</CardTitle>
            <CardDescription>
              Start building your generative AI apps with our essential tools
              and frameworks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DialogBox />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default Homepage;
