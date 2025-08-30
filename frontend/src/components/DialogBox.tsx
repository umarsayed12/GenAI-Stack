import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { useStacks } from "@/hooks/useStacks";
import { useForm } from "react-hook-form";
import type { SubmitHandler } from "react-hook-form";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
type FormData = {
  name: string;
  desc: string;
};
function DialogBox({ onStackCreated }: { onStackCreated?: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();
  const { createStack, fetchStacks } = useStacks();
  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setLoading(true);
    try {
      await createStack({ name: data.name, description: data.desc });
      toast.success("Stack created successfully");
      setOpen(false);
    } catch (error) {
      toast.error("Error creating stack. Try Again.");
    }
    setLoading(false);
    onStackCreated?.();
  };
  useEffect(() => {
    const loadStacks = async () => {
      await fetchStacks();
    };

    loadStacks();
  }, [fetchStacks]);
  return (
    <Dialog open={open}>
      <DialogTrigger asChild>
        <Button className="cursor-pointer" onClick={() => setOpen(true)}>
          + New Stack
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Stack</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4">
            <div className="grid gap-3">
              <Label htmlFor="name-1">Name</Label>
              <Input
                id="name-1"
                {...register("name", { required: "Name is required" })}
              />
              {errors.name && (
                <p className="text-red-600">{errors?.name?.message}</p>
              )}
            </div>
            <div className="grid gap-3">
              <Label htmlFor="desc">Description</Label>
              <Textarea
                id="desc"
                className="h-[150px]"
                {...register("desc", { required: "Description is required" })}
              />
              {errors.desc && (
                <p className="text-red-600">{errors?.desc?.message}</p>
              )}
            </div>
          </div>
          <DialogFooter className="pt-4">
            <DialogClose asChild>
              <Button
                onClick={() => setOpen(false)}
                variant="outline"
                className="cursor-pointer"
              >
                Cancel
              </Button>
            </DialogClose>
            {!loading ? (
              <Button type="submit" className="cursor-pointer">
                Create
              </Button>
            ) : (
              <Button type="submit" disabled className="cursor-pointer">
                Create <Loader2 className="w-2 h-2 animate-spin" />
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default DialogBox;
